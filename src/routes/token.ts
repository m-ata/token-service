import express, { type Request, type Response } from 'express'
import jwt from 'jsonwebtoken'
import { verifyToken } from '../middlewares/token.middleware'
import { logout, getToken, refreshToken } from '../controllers/token.controller'
import { type ITokenResponse, type ITokenPayload, type IToken } from '../interfaces/token.interface'

const router = express.Router()

/*
 token and refresh token route handler
*/
router.post('/token', async (req: Request, res: Response) => {
  try {
    const body: ITokenPayload = req.body
    console.debug('POST /token called')
    const response: ITokenResponse =
      body.grant_type === 'refresh_token'
        ? await refreshToken({
          ...body,
          code: body.code ? body.code.replace(/ /g, '').toLowerCase() : null,
          username: body.username ? body.username.replace(/ /g, '') : null
        })
        : await getToken({
          ...body,
          code: body.code ? body.code.replace(/ /g, '').toLowerCase() : null,
          username: body.username ? body.username.replace(/ /g, '') : null
        })
    console.log('response:', response)
    const token = jwt.decode(response.access_token)
    console.log('token:', token)
    res.status(200).send(response)
  } catch (error) {
    console.error(
      'Error in POST /token',
      JSON.stringify({
        body: (({ password, ...body }) => body)(req.body),
        error
      })
    )
    console.log('error ==> ', error)
    if (error.status) res.status(error.status).send(error.message)
    else res.status(500).send('internal error')
  }
})
/*
 logout route handler
*/
router.post('/logout', async (req: Request, res: Response) => {
  try {
    console.debug('POST /logout called', req.headers)
    const token: IToken = await verifyToken(req)
    await logout(token)
    res.status(200).send('OK')
  } catch (error) {
    console.error('Error in  POST /logout', error)
    if (error.status) res.status(error.status).send(error.message)
    else res.status(500).send('internal error')
  }
})

export default router
