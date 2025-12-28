import dotenv from 'dotenv'
import { siteDomains } from '../config/constant.js';
dotenv.config()
export const Constants = {
    EMAIL_BODY_HB_FRONTEND_HOST_URL:process.env.EMAIL_BODY_HB_FRONTEND_HOST_URL,
    redirectTo:"/customer/order",
    email: {
        footer: {
            email: "support@peptide.store",
            isFooterShow:true
        }
    },
    images: {
        logo_url:"https://static.peptide.store/public/logo-hb.png",
        // bg_url: "https://cdn.peptide.shop/public/b7e62955-baa7-4144-9b75-53f1d751312e.jpg"
    }
}

export const getConstantsForOrigin = (origin) => {
    return {
        EMAIL_BODY_HB_FRONTEND_HOST_URL: (!origin || origin==siteDomains.hb_shop)? "https://link.peptide.store": `https://${origin}`,
        UNSUBSCRIBE_REDIRECT_LINK_HB: (!origin || origin==siteDomains.hb_shop)? "https://link.peptide.store/notifications/unsubscribe": `https://${origin}/notifications/unsubscribe`,
        email: {
            footer: {
                email:'support@peptide.store',
                unsubscribe_link: process.env.UNSUBSCRIBE_REDIRECT_LINK_HB,
                isFooterShow:true
            }
        },
        images: {
            logo_url:"https://static.peptide.store/public/logo-hb.png",
            // bg_url: "https://cdn.peptide.shop/public/b7e62955-baa7-4144-9b75-53f1d751312e.jpg"
        }
    };
}