import moment from "moment";

import LabTestedProductModel from "../../models/LabTestedProduct.model.js";
import { findWithPagination, isValidDate, responseError, responseSuccess } from "../../utils/func.js";
import ProductModel from "../../models/Product.model.js";

export const labTestedProductGet = async (req, res, next) => {
    try {
        let { q,sort, page, limit, site = "hb", startDate, endDate } = req.query;
        limit = 21;
        const options = {
            model: LabTestedProductModel,
            query: {

            },
            sort: {
                "title": 1,
            },
            select: null,
            page: parseInt(page || 1) || 1,
            limit: parseInt(limit || 10) || 10,
            hint: null,
            populate: [
                {
                    path: "products",
                    select: "title _id slug"
                }

            ],
        };

        if (q) {

            const productIds = await ProductModel.find({
                title: {
                    $regex: q.trim(),
                    $options: 'i'
                }
            }).lean();

            options.query['$or'] = [
                {
                    title: {
                        $regex: q.trim(),
                        $options: 'i'
                    }
                }
            ];

            if (productIds?.length) {
                options.query['$or'].push({
                    products: { 
                        $in: productIds.map(product => product?._id)
                    }
                });
            }

        }


        if (site !== "all" && site !== "" && site) {
            options.query['site'] = site.trim()
        }
        if (startDate && endDate) {
            if (!isValidDate(startDate)) {
                return res
                    .status(400)
                    .json(
                        responseError(
                            "Query startDate invalid!"
                        )
                    );
            }
            if (!isValidDate(endDate)) {
                return res
                    .status(400)
                    .json(
                        responseError(
                            "Query endDate invalid!"
                        )
                    );
            }

            options.query["createdAt"] = {
                $gte: moment(startDate)
                    .startOf("day")
                    .toDate(),
                $lte: moment(endDate)
                    .endOf("day")
                    .toDate(),
            };
        }

        if (sort) {
            switch (sort) {
              case 'latest':
                options.sort = { 'createdAt': -1 };
                break;
              case 'oldest':
                options.sort = { 'createdAt': 1 };
                break;
              default:
                options.sort = { 'createdAt': -1 }; // Default to latest
            }
          }
        const data = await findWithPagination(options);

        const resData = responseSuccess("fetch lab tested products", data);
        return res.status(200).json(resData)
    } catch (error) {
        next(error)
    }
}