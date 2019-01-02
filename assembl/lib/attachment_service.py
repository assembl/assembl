import hashlib
from os import path
from tempfile import TemporaryFile


class AttachmentService(object):
    def __init__(self):
        pass

    def computeHash(self, filename):
        hashobj = hashlib.new('SHA256')
        with open(filename, 'rb') as stream:
            for data in stream:
                hashobj.update(data)
        return hashobj.hexdigest()


class HashFsAttachmentService(AttachmentService):
    def __init__(self):
        from .hash_fs import get_hashfs
        self.hashfs = get_hashfs()

    def put_file(self, dataf):
        # dataf may be a file-like object or a file path
        address = self.hashfs.put(dataf)
        return address.id

    def get_file_path(self, fileHash):
        return self.hashfs.get(fileHash).abspath.encode('ascii')

    def get_file_stream(self, fileHash):
        return open(self.get_file_path(fileHash), 'b')

    def get_file_url(self, fileHash):
        return b'/private_uploads' + self.get_file_path(fileHash)[len(self.hashfs.root):]

    def delete_file(self, fileHash):
        self.hashfs.delete(fileHash)

    def exists(self, fileHash):
        return path.exists(self.get_file_path(fileHash))


class AmazonAttachmentService(AttachmentService):
    def __init__(self, bucket_name):  # region? secrets? using config right now.
        import boto3
        self.bucket_name = bucket_name
        self.s3 = boto3.client('s3')
        s3 = boto3.resource('s3')
        self.bucket = s3.Bucket(bucket_name)

    def put_file(self, filename, mimetype=None):
        key = self.computeHash(filename)
        if not self.exists(key):
            self.bucket.upload_file(filename, key, {
                'ACL': 'authenticated-read',
                'ContentType': mimetype or 'application/binary',
                'ContentLength': path.getsize(filename)
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
        return self.s3.generate_presigned_url(
            ClientMethod='get_object',
            Params={
                'Bucket': self.bucket_name,
                'Key': fileHash
            }
        )

    def delete_file(self, fileHash):
        self.s3.delete_file(Bucket=self.bucket_name, Key=fileHash)

    def exists(self, fileHash):
        return bool([x for x in self.bucket.objects.filter(Prefix=fileHash) if x.key == fileHash])
