import 'source-map-support/register'
import Axios from 'axios'
import { decode, verify } from 'jsonwebtoken';
import { createLogger } from '../../utils/logger';

const logger = createLogger('auth');

const jwksUrl = process.env.AUTH_JWKS_URL;

export async function handler(event) {
  try {
    const jwtToken = await verifyToken(event.authorizationToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader) {
  const token = getToken(authHeader);
  const jwt = decode(token, { complete: true });
  if (!jwt) {
    throw new Error('jwt is empty');
  }

  const kid = jwt.header.kid;
  if (!kid) {
    throw new Error('kid is empty');
  }

  const publicKey = await getCert(kid);

  return verify(token, publicKey, { algorithms: ['RS256'] });
}

function getToken(authHeader) {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}

const getCert = async (kid) => {
  logger.info(`Getting certificate, header kid: ${kid}`)
  var jwksResponse = await Axios.get(jwksUrl);

  const keys = jwksResponse.data.keys;
  if (!keys) {
    throw new Error('JWKS does not existed');
  }

  const signingKeys = jwksResponse.data.keys
    .filter(key => key.use === 'sig'
      && key.kty === 'RSA'
      && key.kid
      && ((key.x5c && key.x5c.length) || (key.n && key.e))
    ).map(key => {
      return { kid: key.kid, nbf: key.nbf, publicKey: certToPEM(key.x5c[0]) };
    });
  const key = signingKeys.find(k => k.kid === kid);
  return key.publicKey;
}

const certToPEM = (cert) => {
  cert = cert.match(/.{1,64}/g).join('\n');
  cert = `-----BEGIN CERTIFICATE-----\n${cert}\n-----END CERTIFICATE-----\n`;
  return cert;
}