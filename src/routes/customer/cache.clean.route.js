import express from "express";
import { siteType } from "../../config/constant.js";
import { redisClient } from "../../config/db.js";
import { redisCacheVariable } from "../../config/redisCacheVariable.js";
import { responseError, responseSuccess } from "../../utils/index.js";
const cacheCleanerTokenValidate = (req, res, next) => {
    try {
        const bearer = req.headers.authorization
        const token = bearer && (bearer.split(' ')[1] || '') && bearer.split(' ')[1].trim()
        if (token === process.env.CACHE_CLEANER_TOKEN) {
            return next()
        } else {
            return res.status(400).json(responseError('Invalid token!'))
        }
    } catch (error) {
        console.error(error)
        return res.status(400).json(responseError('Invalid token!'))
    }
}
const router = express.Router();
router.get('/cache-clear', cacheCleanerTokenValidate, async (req, res, next) => {
    try {
        const validateCodes = [...Object.values(redisCacheVariable).filter(item => {
            return item !== 'home:featuredProducts' || item !== 'allBundleProducts' || item !== 'allProducts' || item !== 'allNewProducts'
        }),
        'home:featuredProducts' + siteType._all,
        'home:featuredProducts' + siteType._hb,
        'home:featuredProducts' + siteType._auctropin,

        'allBundleProducts' + siteType._all,
        'allBundleProducts' + siteType._hb,
        'allBundleProducts' + siteType._auctropin,

        'allProducts' + siteType._all,
        'allProducts' + siteType._hb,
        'allProducts' + siteType._auctropin,

        'allNewProducts' + siteType._all,
        'allNewProducts' + siteType._hb,
        'allNewProducts' + siteType._auctropin,
        'app:info' + siteType._hb,
        'app:info' + siteType._auctropin,
        ]
        let { key } = req.query
        if (!key) {
            return res.status(400).json(responseError('Query key is missing!'))
        }
        key = key.trim()
        const splitKeys = key.split(',').filter(item => validateCodes.includes(item))
        const isValidKeys = splitKeys.some(item => validateCodes.includes(item))

        if (!isValidKeys) {
            return res.status(400).json(responseError('Query key is invalid!'))
        }
        let message = ''

        const cleanCacheVariables = []
        const emptyCacheVariables = []
        for (let cleanKey of splitKeys) {
            const cacheExist = await redisClient.get(cleanKey)
            if (cacheExist) {
                cleanCacheVariables.push(cleanKey)
                message = `${cleanKey} Cache successfully cleaned!`
                await redisClient.del(cleanKey)
            } else {
                emptyCacheVariables.push(cleanKey)
                message = `${cleanKey} Clean cache is empty!`
            }
        }
        console.log({ key, cleanCacheVariables, emptyCacheVariables })
        return res.status(200).json(responseSuccess(message, { key, cleanCacheVariables, emptyCacheVariables }))

    } catch (error) {
        console.error(error)
        return res.status(400).json(responseError('Failed to clean cache!', 400))
    }
})
export default router;