import { APIGatewayProxyEventV2 } from "aws-lambda";
import Database from "@sst-aurora-v2/core/database";

export const main = async (event: APIGatewayProxyEventV2) => {
  try{
    const { sql } = await Database({ RDS_SECRET_ARN: process.env.RDS_SECRET_ARN });
    const query = await sql`SELECT version() as Postgres;`;
    return {
      statusCode: 200,
      body: JSON.stringify(query),
    }
  } catch (error) {
    console.log(error);
    return {
      statusCode: 500,
      body: JSON.stringify(error),
    };
  };
};

export default main