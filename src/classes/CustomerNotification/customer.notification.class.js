import axios from "axios";
import CustomerNotificationModel, { CustomerNotificationTypeEnum } from "../../models/CustomerNotification.model.js";

class NotificationType {
    constructor(type, msgTemplate) {
        this.type = type;
        this.msgTemplate = msgTemplate;
    }

    formatMessage(replacements) {
        let message = this.msgTemplate;
        for (const [key, value] of Object.entries(replacements)) {
            message = message.replace(new RegExp(`#${key}_REPLACE`, 'g'), value);
        }
        return message;
    }

    getType() {
        return this.type;
    }

    getMessageTemplate() {
        return this.msgTemplate;
    }

    getRawNotification() {
        return {
            type: this.type,
            msgTemplate: this.msgTemplate
        };
    }
}

export class CustomerNotificationClass {
    static notificationTypes = {
        [CustomerNotificationTypeEnum.ORDER_PAID]: new NotificationType(
            CustomerNotificationTypeEnum.ORDER_PAID,
            "A new order is confirmed: #ORDER_ID_REPLACE is awaiting to be packed and shipped. Click #REPLACE_HERE_URL to view it."
        ),
        [CustomerNotificationTypeEnum.ORDER_PACKED]: new NotificationType(
            CustomerNotificationTypeEnum.ORDER_PACKED,
            "Order #ORDER_ID_REPLACE is now packed and awaiting shipment. Click #REPLACE_HERE_URL to view it."
        ),
        [CustomerNotificationTypeEnum.ORDER_PARTIALLY_SHIPPED]: new NotificationType(
            CustomerNotificationTypeEnum.ORDER_PARTIALLY_SHIPPED,
            "Order #ORDER_ID_REPLACE is partially shipped and on the way. More parts will be shipped soon and awaiting shipment. Click #REPLACE_HERE_URL to view it."
        ),
        [CustomerNotificationTypeEnum.ORDER_FULLY_SHIPPED]: new NotificationType(
            CustomerNotificationTypeEnum.ORDER_FULLY_SHIPPED,
            "Order #ORDER_ID_REPLACE is fully shipped and on the way. Click #REPLACE_HERE_URL to view it."
        ),
        [CustomerNotificationTypeEnum.ORDER_NEW_COMMENTS]: new NotificationType(
            CustomerNotificationTypeEnum.ORDER_NEW_COMMENTS,
            "Order #ORDER_ID_REPLACE has a new message. Click #REPLACE_HERE_URL to view it and respond."
        )
    };

    static getCustomerNotification(type) {
        return this.notificationTypes[type];
    }

    static getRawNotification(type) {
        const notification = this.notificationTypes[type];
        return notification ? notification.getRawNotification() : null;
    }

    static getEnumValue(enumKey) {
        return CustomerNotificationTypeEnum[enumKey];
    }

    static async CreateCustomerNotification(type, data) {
        const rawNotification = this.getRawNotification(type);
        if (!rawNotification) {
            throw new Error('Invalid notification type');
        }

        const notificationData = {
            customerId: data.customerId,
            msgTemplate: rawNotification.msgTemplate,
            type: rawNotification.type,
            meta: {
                orderId: data.orderId || null
            },
            isDisplay: data.isDisplay !== undefined ? data.isDisplay : true,
            site:data.site||'hb'
        };

        const customerNotification = new CustomerNotificationModel(notificationData);
        await customerNotification.save();

        axios.post(`${process.env.BACK_END_URL_ADMIN}/api/v1.0/admin/socket/emit?token=${process.env.CACHE_CLEANER_TOKEN}`,{
            to: `customer_${data.customerId}`,
            action: "notifications",
            data: customerNotification,
        },{
            headers: {
                'Content-Type': 'application/json',
                "Origin": process.env.FRONT_END_URL_CUSTOMER,
            }
        }).then((e)=>{
            console.log(e.data)
        }).catch((e)=>{
            console.log(e?.response || e)
        });

        console.log('Create:CustomerNotification',customerNotification)
        return customerNotification;
    }
}

// // Example usage:
// const orderPaidNotification = CustomerNotificationClass.getCustomerNotification(CustomerNotificationClass.getEnumValue('ORDER_PAID'));

// // Get the raw type and message template as an object
// const rawNotification = orderPaidNotification.getRawNotification();

// console.log(rawNotification);
// // Outputs: { type: 'ORDER_PAID', msgTemplate: 'A new order is confirmed: #ORDER_ID_REPLACE is awaiting to be packed and shipped. Click #REPLACE_HERE_URL to view it.' }

// // Format the message with replacements
// const formattedMessage = orderPaidNotification.formatMessage({
//     ORDER_ID: '12345',
//     REPLACE_HERE_URL: 'http://example.com/order/12345'
// });

// console.log(formattedMessage);  // Outputs the formatted message for the ORDER_PAID notification


// Example usage:
// const main = async () => {
//     // Ensure you have a valid MongoDB connection here before using this.
//     try {
//         const newNotification = await CustomerNotificationClass.CustomerNotificationBuild(NotificationTypeEnum.ORDER_NEW_COMMENTS, {
//             customerId: '60d0fe4f5311236168a109ca', // replace with a valid ObjectId
//             orderId: '12345',
//             isDisplay: true
//         });

//         console.log(newNotification);
//     } catch (error) {
//         console.error(error);
//     }
// };

// main();
