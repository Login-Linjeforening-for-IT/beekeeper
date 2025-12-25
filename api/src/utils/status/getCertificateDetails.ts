import https from 'https'
import classifyKeyType from './classifyKeyType.ts'

export async function getCertificateDetails(service: MonitoredService): Promise<Certificate | InvalidCertificate> {
    return new Promise((resolve) => {
        const req = https.request(
            service.url, { rejectUnauthorized: false }, res => {
                let certificate
                try {
                    // @ts-ignore
                    certificate = res.socket.getPeerCertificate(true)
                } catch {
                    return resolve({
                        valid: false,
                        message: 'Certificate could not be read',
                        service: service.url
                    })
                }

                if (!certificate || Object.keys(certificate).length === 0) {
                    return resolve({
                        valid: false,
                        message: 'No certificate information available',
                        service: service.url
                    })
                }

                resolve({
                    valid: true,
                    subjectCN: certificate.subject?.CN,
                    issuer: {
                        cn: certificate.issuer?.CN,
                        name: certificate.issuer.O
                    },
                    validFrom: certificate.valid_from,
                    validTo: certificate.valid_to,
                    keyType: classifyKeyType(certificate),
                    signatureAlgorithm: certificate.signatureAlgorithm,
                    publicKeyAlgorithm: certificate.publicKeyAlgorithm ?? certificate.asn1Curve ?? certificate.nistCurve,
                    dnsNames: certificate.subjectaltname,
                    raw: certificate
                })
            }
        )

        req.on('error', (err) => {
            resolve({
                valid: false,
                message: 'Certificate is not valid or does not match the hostname',
                reason: err.message,
                // @ts-ignore
                code: err.code,
                service: service.url
            })
        })

        req.end()
    })
}
