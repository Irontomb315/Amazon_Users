import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { badRequest, internalError, ok, unauthorized } from "./lib/response";
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";
import { generateAccessToken, generateRefreshToken } from "./lib/jwt";
import { dynamo } from "./lib/dynamodb";
import { withCors } from "./common/cors";

const USERS_TABLE = process.env.USERS_TABLE;
const REFRESH_TOKENS_TABLE = process.env.REFRESH_TOKENS_TABLE;

async function loginHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        const body = JSON.parse(event.body ?? "{}");
        const { email, password } = body;

        if (!email || !password) {
            return badRequest("El email y password son requeridos.");
        }

        //Buscamos el usuario
        const result = await dynamo.send(
            new QueryCommand({
                TableName: USERS_TABLE,
                IndexName: "EmailIndex",
                KeyConditionExpression: "email = :email",
                ExpressionAttributeValues: { ":email": email }
            })
        )

        const user = result.Items?.[0];

        //Validación de existencia de user

        if (!user) {
            return unauthorized("Credenciales Invalidas.");
        }

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return unauthorized("Credenciales Invalidas.");
        }

        const payload = { userId: user.userId, email: user.email, role: user.role };
        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        //Guardar el refresh token en DynamoDB para que dure 7 dias

        const expiresAt = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
        await dynamo.send(
            new PutCommand({
                TableName: REFRESH_TOKENS_TABLE,
                Item: { token: refreshToken, userId: user.userId, expiresAt }
            })
        )

        return ok({ accessToken, refreshToken });
    } catch (error) {
        console.error("login error: ", error);
        return internalError(); 
    }
}   

export const login = withCors(loginHandler);