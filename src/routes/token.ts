import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { getToken, refreshToken } from "../middlewares/token.middleware";

const router = express.Router();

router.post("/token", async (req: Request, res: Response) => {
  try {
    const { body } = req;
    console.debug(`POST /token called`);
    console.debug(`body ${req} ${JSON.parse(JSON.stringify(body))}`);
    let response =
      body.grant_type === "refresh_token"
        ? await refreshToken({
            ...body,
            code: body.code ? body.code.replace(/ /g, "").toLowerCase() : null,
            username: body.username ? body.username.replace(/ /g, "") : null,
          })
        : await getToken({
            ...body,
            code: body.code ? body.code.replace(/ /g, "").toLowerCase() : null,
            username: body.username ? body.username.replace(/ /g, "") : null,
          });
    console.log(`response:`, response);
    let token = jwt.decode(response.access_token);
    console.log(`token:`, token);
    res.status(200).send(response);
  } catch (error) {
    console.error(
      `Error in POST /token`,
      JSON.stringify({
        body: (({ password, ...body }) => body)(req.body),
        error: error,
      }),
    );
    console.log('error ==> ', error);
    if (error.status) res.status(error.status).send(error.message);
    else res.status(500).send(`internal error`);
  }
});

export default router;

