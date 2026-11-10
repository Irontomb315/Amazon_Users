import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { badRequest, internalError, ok, unauthorized, notFound } from "./lib/response";
import { GetCommand, PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";
import { generateAccessToken, generateRefreshToken } from "./lib/jwt";
import { dynamo } from "./lib/dynamodb";
import { withCors } from "./common/cors";

const USERS_TABLE = process.env.USERS_TABLE;

async function updateUserHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        const userId = event.pathParameters?.id;
        if(!userId){
            return notFound("Usuario no encontrado.");
        }

        const callerId = event.requestContext.authorizer?.userId;
        
        if(callerId !== userId){
            return badRequest("Solo puedes actualizar a tu propio usuario");
        }

        const body = JSON.parse(event.body ?? "{}");

        const { name } = body;

        if(!name){
            return badRequest("El nombre es requerido.");
        }

        const existing = await dynamo.send(
            new GetCommand({ TableName: USERS_TABLE, Key: { userId } })
        )

        if(!existing.Item){
            return notFound("El usuario no fue encontrado.");
        }

        const now = new Date().toISOString();
        await dynamo.send(
            new UpdateCommand({
                TableName: USERS_TABLE,
                Key: { userId },
                UpdateExpression: "SET #name = :name, updatedAt = :updatedAt",
                ExpressionAttributeNames: { "#name": "name" },
                ExpressionAttributeValues: { ":name": name, ":updatedAt": now }
            })
        )

        return ok({ message: "Usuario actualizado exitosamente" })
    } catch (error) {
        console.error("Error en getUser: ", error);
        return internalError();
    }
}

export const updateUser = withCors(updateUserHandler);