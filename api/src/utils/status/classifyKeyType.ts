// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function classifyKeyType(cert: any) {
    const algo = cert.publicKeyAlgorithm?.toLowerCase() || ''
    const curve = cert.asn1Curve || cert.nistCurve || ''

    let keyType: string
    if (algo.includes('ecdsa') || curve) {
        keyType = 'ECDSA'
    } else {
        keyType = 'RSA'
    }

    let hash = 'SHA-256'
    if (cert.signatureAlgorithm) {
        const sig = cert.signatureAlgorithm.toLowerCase()
        if (sig.includes('sha256')) {
            hash = 'SHA-256'
        } else if (sig.includes('sha384')) {
            hash = 'SHA-384'
        } else if (sig.includes('sha512')) {
            hash = 'SHA-512'
        } else if (sig.includes('sha1')) {
            hash = 'SHA-1'
        }
    } else if (keyType === 'RSA') {
        hash = 'SHA-256'
    }

    return `${keyType} signature with ${hash}`
}
