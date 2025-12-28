import moment from "moment";
import LabTestedProductModel from "../../models/LabTestedProduct.model.js";
import LabTestedProductTrackModel from "../../models/LabTestedProductTrack.model.js";
import { isValidObjectId, responseError, responseSuccess } from "../../utils/index.js";

export const labTestedProductTrackCreate = async (req, res, next) => {
    try {
        const { labTestedId, isClicked = true, site = "hb" } = req.body;
        const query = {

        }
        if (site !== "all" && site !== "" && site) {
            query['site'] = site.trim()
        }
        if (!(isValidObjectId(labTestedId))) {
            return res.status(400).json(responseError("invalid request productId or labTestedId are not valid."));
        }

        const labTestedProduct = await LabTestedProductModel.findOne({ ...query, _id: labTestedId }).lean();

        if (!labTestedProduct?._id) {
            return res.status(400).json(responseError("Lab tested product are not valid."));
        }

        const timezone = "America/New_York";

        const dateString = moment.tz(new Date(), timezone).format("yyyy-MM-DD");
        const todayStartAt = moment.tz(`${dateString} 00:00:00`, timezone).toDate();
        const todayEndAt = moment.tz(`${dateString} 23:59:59`, timezone).toDate();

        console.log("Today Start At", todayStartAt, "Today End At", todayEndAt, "dateString", dateString);

        let doc = await LabTestedProductTrackModel.findOne({
            ...query,
            labTestedProduct: labTestedProduct?._id,
            createdAt: { $gte: todayStartAt, $lte: todayEndAt },

        });

        if (!doc) {
            doc = new LabTestedProductTrackModel({
                labTestedProduct: labTestedProduct?._id,
                customerId: req?.customer?._id || null,
                totalClicked: 0,
                date: dateString,
                site: site,
            });
        }

        if (isClicked ===true) {
            doc.totalClicked += 1;
        }

        await doc.save();

        console.log("LabTestedProductTrack DOC Saved", doc);

        return res.status(200).json(responseSuccess("Success", {}));
    } catch (err) {
        next(err);
    }
}