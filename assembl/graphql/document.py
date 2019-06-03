import graphene
from graphene.relay import Node
import ntpath
from pyramid.i18n import TranslationStringFactory
from pyramid.httpexceptions import HTTPUnauthorized
import magic

from graphene_sqlalchemy import SQLAlchemyObjectType

import assembl.graphql.docstrings as docs
from assembl import models
from assembl.auth import CrudPermissions
from assembl.lib.config import get_config

from .permissions_helpers import require_cls_permission
from .types import SecureObjectType
from .utils import abort_transaction_on_exception

from ..lib import logging

log = logging.getLogger('assembl')
_ = TranslationStringFactory('assembl')


class Document(SecureObjectType, SQLAlchemyObjectType):
    __doc__ = docs.Document.__doc__

    class Meta:
        model = models.Document
        interfaces = (Node, )
        only_fields = ('id', 'mime_type')

    title = graphene.String(description=docs.Document.title)
    external_url = graphene.String(description=docs.Document.external_url)
    av_checked = graphene.String(description=docs.Document.av_checked)

    def resolve_title(self, args, context, info):
        # For existing documents, be sure to get only the basename,
        # removing "\" in the path if the document was uploaded on Windows.
        # This is done now in the uploadDocument mutation for new documents.
        return ntpath.basename(self.title)


class UploadDocument(graphene.Mutation):
    __doc__ = docs.UploadDocument.__doc__

    class Input:
        file = graphene.String(
            required=True,
            description=docs.UploadDocument.file
        )

    document = graphene.Field(lambda: Document)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)

        cls = models.Document

        require_cls_permission(CrudPermissions.CREATE, cls, context)

        uploaded_file = args.get('file')
        if uploaded_file is not None:

            # Because the server is on GNU/Linux, os.path.basename will only work
            # with path using "/". Using ntpath works for both Linux and Windows path
            filename = ntpath.basename(context.POST[uploaded_file].filename)
            allowed_filetypes = aslist(get_config()['attachment_allowed_mime_types'])
            content = context.POST[uploaded_file].file.read()
            context.POST[uploaded_file].file.seek(0)
            filetype = magic.from_buffer(content, mime=True)
            generic_mimetypes = [e.split('/')[0] for e in allowed_filetypes if e.split('/')[1] == '*']
            specific_mimetypes = [e for e in allowed_filetypes if e.split('/')[1] != '*']
            if filetype.split('/')[0] not in generic_mimetypes and filetype not in specific_mimetypes:
                error = _('Sorry, this file type is not allowed.')
                log.info("Mimetype %s wasn't found in allowed_filetypes" % filetype)
                raise HTTPUnauthorized(context.localizer.translate(error))

            mime_type = context.POST[uploaded_file].type
            document = models.File(
                discussion=discussion,
                mime_type=mime_type,
                title=filename)
            document.add_file_data(context.POST[uploaded_file].file)
            discussion.db.add(document)
            document.db.flush()

        return UploadDocument(document=document)
