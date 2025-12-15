import { Commission } from "../models/commision.model.js";

export const CreateCommission = async ({
  broker_id,
  owner_id,
  client_id,
  listing_id,
  listing_type,
  sale_price,
}) => {
  const commissionRate = 0.03;
  const total_commission = sale_price * commissionRate;
  
  let app_fee = 0;
  let owner_share = 0;
  let client_share = 0;
  let commission_type = "";
  
  if(broker_id){
    commission_type= 'broker_commission' ;
    app_fee = total_commission * 0.10;

    const remaining_amount = total_commission - app_fee;
    owner_share = remaining_amount/2;
    client_share = remaining_amount/2;
  }
  else{
    commission_type= 'system_commission';
    owner_share = total_commission / 2;
    client_share = total_commission / 2;
    app_fee = client_share + owner_share;
  }
  const due_date = new Date();
  due_date.setDate(due_date.getDate() + 3);

  const commission = await Commission.create({
    broker_id,
    owner_id,
    client_id,
    listing_id,
    listing_type,
    sale_price,
    total_commission,
    owner_share,
    client_share,
    app_fee,
    commission_type,
    due_date
  });

  return commission.toObject();
};
