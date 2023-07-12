import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager'
import postgres from 'postgres'

export const main = async (options={}) => {
  const secretsClient = new SecretsManagerClient({})
  const secret = await secretsClient.send(new GetSecretValueCommand({
    SecretId: options.RDS_SECRET_ARN,
  }))
  const secretValues = JSON.parse(secret.SecretString ?? '{}')
  const DATABASE_URL = `postgres://${secretValues.username}:${secretValues.password}@${secretValues.host}:${secretValues.port}/postgres`;
  const sql = postgres(DATABASE_URL);
  return { DATABASE_URL, postgres, sql }
}

export default main