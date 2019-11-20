import hashlib
from os import path
from tempfile import TemporaryFile

from .config import get


class AttachmentService(object):
    def __init__(self):
        pass

    def computeHash(self, dataf):
        hashobj = hashlib.new('SHA256')
        if hasattr(dataf, 'read'):
            pos = dataf.tell()
            for data in dataf:
                hashobj.update(data)
            dataf.seek(pos)
        else:
            with open(dataf, 'rb') as stream:
                for data in stream:
                    hashobj.update(data)
        return hashobj.hexdigest()

    @classmethod
    def get_service(cls):
        if not hasattr(cls, '_service'):
            service = get('attachment_service', 'hashfs')
            if service == 'hashfs':
                cls._service = HashFsAttachmentService()
            elif service == 's3':
                cls._service = AmazonAttachmentService()
            else:
                raise RuntimeError("No attachment service")
        return cls._service


class HashFsAttachmentService(AttachmentService):
    def __init__(self):
        from .hash_fs import get_hashfs
        self.hashfs = get_hashfs()

    def put_file(self, dataf):
        # dataf may be a file-like object or a file path
        address = self.hashfs.put(dataf)
        return address.id

    def get_file_path(self, fileHash):
        file_path = self.hashfs.get(fileHash)
        if file_path:
            return file_path.abspath.encode('ascii')
        else:
            return None

    def get_file_stream(self, fileHash):
        file_path = self.get_file_path(fileHash)
        return open(file_path, 'rb') if file_path else None

    def get_file_url(self, fileHash):
        return b'/private_uploads' + self.get_file_path(fileHash)[len(self.hashfs.root):]

    def delete_file(self, fileHash):
        self.hashfs.delete(fileHash)

    def exists(self, fileHash):
        return path.exists(self.get_file_path(fileHash))


class AmazonAttachmentService(AttachmentService):
    def __init__(self):
        import boto3
        self.bucket_name = get('attachment_bucket', 's3_attachments')
        region = get('aws_region')
        self.s3 = boto3.resource('s3', region)
        self.s3c = self.s3.meta.client
        self.bucket = self.s3.Bucket(self.bucket_name)

    def put_file(self, dataf, mimetype=None):
        key = self.computeHash(dataf)
        if not self.exists(key):
            if hasattr(dataf, 'read'):
                self.bucket.upload_fileobj(dataf, key, {
                    'ContentType': mimetype or 'application/octet-stream'
                })
            else:
                self.bucket.upload_file(dataf, key, {
                    'ContentType': mimetype or 'application/octet-stream'
                })
        return key

    def get_file_path(self, fileHash):
        return None

    def get_file_stream(self, fileHash):
        f = TemporaryFile()
        self.bucket.download_fileobj(fileHash, f)
        f.seek(0)
        return f

    def get_file_url(self, fileHash):
        base_url = self.s3c.generate_presigned_url(
            ClientMethod='get_object',
            Params={
                'Bucket': self.bucket_name,
                'Key': fileHash
            }
        )
        return b'/private_uploads/' + base_url.split('/', 3)[-1].encode('ascii')

    def delete_file(self, fileHash):
        self.bucket.delete_objects(Delete={'Objects': [{'Key': fileHash}]})

    def exists(self, fileHash):
        return bool([x for x in self.bucket.objects.filter(Prefix=fileHash) if x.key == fileHash])
