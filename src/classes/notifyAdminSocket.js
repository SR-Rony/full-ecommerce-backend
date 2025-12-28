import axios from "axios";
export function notifySocketAdmin(to,action,data) {
    axios.post(`${process.env.BACK_END_URL_ADMIN}/api/v1.0/admin/socket/emit?token=${process.env.CACHE_CLEANER_TOKEN}`,{
        to: to,
        action: action,
        data: data,
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
}