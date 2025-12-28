import moment from "moment-timezone";
import BundleAnalyticModel from "../../models/Analytics/BundleAnalytics.js";
import ProductModel from "../../models/Product.model.js";
import { responseError, responseSuccess } from "../../utils/index.js";

export const getMinimumOrderAmount = async (req,res,next) => {
    try {
        const result = await fetch("https://api.nowpayments.io/v1/min-amount?currency_from=BTC&currency_to=BTC&fiat_equivalent=usd", {
            headers: {
                "x-api-key": process.env.NOWPAYMENT_API_KEY,
            }
        });
        const data = await result.json();
        res.set('Cache-Control', 'public, max-age=600'); // 10min.
        return res.status(200).json(responseSuccess("Success",data));
    } catch(err) {
        next(err);
    }
}

export const bundleAnalytic = async (req,res,next) => {
    try {
        const {offerProductId,originalProductId,isAccepted,site="hb"} = req.body;
        const query = {
          
          }
          if (site !== "all" && site !== "" && site) {
            query['site'] = site.trim().toLowerCase()
          }
        const offerProduct = await ProductModel.findOne({...query,_id: offerProductId});
        const originalProduct = await ProductModel.findOne({...query,_id: originalProductId});

        if(!offerProduct || !originalProduct ) {
            return res.status(200).json(responseError("Products are not valid."));
        }

        const timezone = "America/New_York";

        const dateString = moment.tz(new Date(),timezone).format("yyyy-MM-DD");
        const todayStartAt = moment.tz(`${dateString} 00:00:00`,timezone).toDate();
        const todayEndAt = moment.tz(`${dateString} 23:59:59`,timezone).toDate();

        console.log("Today Start At",todayStartAt,"Today End At",todayEndAt,"dateString",dateString);

        let doc = await BundleAnalyticModel.findOne({
            ...query,
            "originalProduct.product": originalProduct._id,
            "offerProduct.product": offerProduct._id,
            "createdAt": {$gte: todayStartAt,$lte: todayEndAt},
        });

        if(!doc) {
            doc = new BundleAnalyticModel({
                originalProduct: {
                    bundleSize: parseInt(originalProduct.bundle?.size||0),
                    product: originalProduct._id,
                },
                offerProduct: {
                    bundleSize: parseInt(offerProduct.bundle?.size||0),
                    product: offerProduct._id,
                },
                totalAccepted: 0,
                totalNotAccepted: 0,
                date: dateString,
                site:site,
            });
        }

        if(isAccepted) {
            doc.totalAccepted+=1;
        } else {
            doc.totalNotAccepted+=1;
        }

        await doc.save();

        console.log("DOC Saved",doc);

        return res.status(200).json(responseSuccess("Success",{}));
    } catch(err) {
        next(err);
    }
}