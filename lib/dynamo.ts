import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const isLocal = !!process.env.DYNAMO_ENDPOINT;

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  ...(isLocal && {
    endpoint: process.env.DYNAMO_ENDPOINT,
    credentials: { accessKeyId: "local", secretAccessKey: "local" },
  }),
});

export const ddb = DynamoDBDocumentClient.from(client);

export const TABLE_NAME = process.env.DYNAMO_TABLE_NAME || "lista-regalos";
