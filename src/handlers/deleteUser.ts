import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { badRequest, internalError, ok, notFound } from "./lib/response";
import { DeleteCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo } from "./lib/dynamodb";
import { withCors } from "./common/cors";

const USERS_TABLE = process.env.USERS_TABLE;

async function deleteUserHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        const userId = event.pathParameters?.id;
        if(!userId){
            return notFound("Usuario no encontrado.");
        }

        const callerId = event.requestContext.authorizer?.userId;
        
        if(callerId !== userId){
            return badRequest("Solo puedes borrar a tu propio usuario");
        }

        const existing = await dynamo.send(
            new GetCommand({ TableName: USERS_TABLE, Key: { userId } })
        )

        if(!existing.Item){
            return notFound("El usuario no fue encontrado.");
        }

        await dynamo.send(
            new DeleteCommand({
                TableName: USERS_TABLE,
                Key: { userId }
            })
        )

        return ok({ message: "Usuario borrado exitosamente" })
    } catch (error) {
        console.error("Error en getUser: ", error);
        return internalError();
    }
}

export const deleteUser = withCors(deleteUserHandler);