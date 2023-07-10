
import { APIGatewayProxyEventV2 } from "aws-lambda";
import postgres from 'postgres'

export const main = async (event: APIGatewayProxyEventV2) => {
  try{
    const sql = postgres(process.env.WRITER_URL);
    const query = await sql`SELECT version();`;
    console.log({query});
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