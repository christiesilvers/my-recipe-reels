import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb'
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers'
import { getIdToken, USER_POOL_LOGIN_KEY } from './cognito'

const REGION = import.meta.env.VITE_AWS_REGION as string
const IDENTITY_POOL_ID = import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID as string
const TABLE_NAME = import.meta.env.VITE_USER_DATA_TABLE as string

export type HiddenReel = { id: string; title: string; creator: string }

export type UserData = {
  saved: string[]
  hidden: HiddenReel[]
  ratings: Record<string, number>
}

async function getClient(): Promise<{ client: DynamoDBClient; userId: string } | null> {
  const idToken = await getIdToken()
  if (!idToken) return null

  const payload = JSON.parse(atob(idToken.split('.')[1])) as { sub: string }

  const client = new DynamoDBClient({
    region: REGION,
    credentials: fromCognitoIdentityPool({
      clientConfig: { region: REGION },
      identityPoolId: IDENTITY_POOL_ID,
      logins: { [USER_POOL_LOGIN_KEY]: idToken },
    }),
  })

  return { client, userId: payload.sub }
}

export async function loadUserData(): Promise<UserData | null> {
  const ctx = await getClient()
  if (!ctx) return null
  const { client, userId } = ctx

  const result = await client.send(new GetItemCommand({
    TableName: TABLE_NAME,
    Key: { userId: { S: userId } },
  }))

  if (!result.Item) return { saved: [], hidden: [], ratings: {} }

  return {
    saved: JSON.parse(result.Item.saved?.S || '[]'),
    hidden: JSON.parse(result.Item.hidden?.S || '[]'),
    ratings: JSON.parse(result.Item.ratings?.S || '{}'),
  }
}

export async function saveUserData(data: UserData): Promise<void> {
  const ctx = await getClient()
  if (!ctx) return
  const { client, userId } = ctx

  await client.send(new PutItemCommand({
    TableName: TABLE_NAME,
    Item: {
      userId: { S: userId },
      saved: { S: JSON.stringify(data.saved) },
      hidden: { S: JSON.stringify(data.hidden) },
      ratings: { S: JSON.stringify(data.ratings) },
    },
  }))
}
