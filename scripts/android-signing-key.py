# مفتاح توقيع ثابت لتطبيق أندرويد، يُشتق من سرّ موجود في GitHub (APK_KEY_SEED)
# فيخرج المفتاح نفسه في كل بناء دون حفظه في المستودع (المستودع عام).
# RSA 2048 بأعداد أولية مولّدة من البذرة، وشهادة موقّعة بـ PKCS#1 v1.5 (توقيع حتمي) بتواريخ ورقم ثابتين،
# فتبقى البصمة SHA-256 نفسها دائمًا (تحتاجها assetlinks.json).
import hashlib, hmac, os, sys, datetime
from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives.serialization import pkcs12

seed = os.environ.get("APK_KEY_SEED", "").encode()
if len(seed) < 16:
    sys.exit("APK_KEY_SEED قصير أو غير موجود")
out = sys.argv[1] if len(sys.argv) > 1 else "release.p12"
password = (sys.argv[2] if len(sys.argv) > 2 else "turbawy").encode()

class Drbg:
    def __init__(self, key):
        self.key = hmac.new(b"turbawy-apk-signing-v1", key, hashlib.sha256).digest()
        self.n = 0
    def bytes(self, k):
        buf = b""
        while len(buf) < k:
            self.n += 1
            buf += hmac.new(self.key, self.n.to_bytes(8, "big"), hashlib.sha256).digest()
        return buf[:k]

SMALL = [p for p in range(3, 2000) if all(p % q for q in range(2, int(p ** 0.5) + 1))]
def is_probable_prime(n, rng):
    if any(n % p == 0 for p in SMALL):
        return n in SMALL
    d, r = n - 1, 0
    while d % 2 == 0:
        d //= 2; r += 1
    for _ in range(40):
        a = 2 + int.from_bytes(rng.bytes(128), "big") % (n - 3)
        x = pow(a, d, n)
        if x in (1, n - 1):
            continue
        for _ in range(r - 1):
            x = pow(x, 2, n)
            if x == n - 1:
                break
        else:
            return False
    return True

def gen_prime(rng, bits=1024, e=65537):
    while True:
        c = int.from_bytes(rng.bytes(bits // 8), "big") | (3 << (bits - 2)) | 1
        if (c - 1) % e != 0 and is_probable_prime(c, rng):
            return c

rng = Drbg(seed)
e = 65537
p = gen_prime(rng); q = gen_prime(rng)
while q == p:
    q = gen_prime(rng)
if p < q:
    p, q = q, p
n = p * q
phi = (p - 1) * (q - 1)
d = pow(e, -1, phi)
priv = rsa.RSAPrivateNumbers(p, q, d, d % (p - 1), d % (q - 1), pow(q, -1, p), rsa.RSAPublicNumbers(e, n)).private_key()

name = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, "Turbawy"), x509.NameAttribute(NameOID.ORGANIZATION_NAME, "Turbawy")])
cert = (
    x509.CertificateBuilder()
    .subject_name(name).issuer_name(name)
    .public_key(priv.public_key())
    .serial_number(20261112)
    .not_valid_before(datetime.datetime(2026, 1, 1, tzinfo=datetime.timezone.utc))
    .not_valid_after(datetime.datetime(2076, 1, 1, tzinfo=datetime.timezone.utc))
    .sign(priv, hashes.SHA256())
)
fp = cert.fingerprint(hashes.SHA256()).hex().upper()
with open(out, "wb") as f:
    f.write(pkcs12.serialize_key_and_certificates(b"turbawy", priv, cert, None, serialization.BestAvailableEncryption(password)))
print(":".join(fp[i:i + 2] for i in range(0, len(fp), 2)))
