import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { badRequest, internalError, ok, unauthorized, notFound } from "./lib/response";
import { GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";
import { generateAccessToken, generateRefreshToken } from "./lib/jwt";
import { dynamo } from "./lib/dynamodb";
import { withCors } from "./common/cors";

const USERS_TABLE = process.env.USERS_TABLE;

async function getUserHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        const userId = event.pathParameters?.id;
        if(!userId){
            return notFound("El id es necesario en el path");
        }

        const result = await dynamo.send(
            new GetCommand({ TableName: USERS_TABLE, Key: { userId } })
        )

        if(!result.Item){
            return notFound("Usuario no encontrado en base de datos");
        }

        const { password:_, ...userPublic } = result.Item;

        return ok({ user: userPublic });
    } catch (error) {
        console.error("Error en getUser: ", error);
        return internalError();
    }
}

export const getUser = withCors(getUserHandler);