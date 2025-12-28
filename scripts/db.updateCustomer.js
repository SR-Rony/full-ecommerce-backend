import CustomerModel from "../src/models/Customer.model.js";

export const updateCustomerApproved_by_admin_at = async () => {
    console.log("updateCustomerApproved_by_admin_at=> old order update approved_by_admin_at 'approved_by_admin_at' initiated")
const res=await CustomerModel.updateMany(
  { 
    isEmailVerified: true,
    $or: [
      { approved_by_admin_at: { $exists: false } },
      { approved_by_admin_at: null }
    ]
  },
  { $set: { approved_by_admin_at: new Date() } }
);

console.log("updateCustomerApproved_by_admin_at=> old order update approved_by_admin_at 'approved_by_admin_at' completed",res)
}
