import { Commission } from "../models/commission.model.js";

export const CreateCommission = async ({
  broker_id,
  owner_id,
  buyer_id,
  listing_id,
  listing_type,
  sale_price,
}) => {
  const commissionRate = 0.15;
  const total_commission = sale_price * commissionRate;

  const owner_share = total_commission / 2;
  const buyer_share = total_commission / 2;

  const commission = await Commission.create({
    broker_id,
    owner_id,
    buyer_id,
    listing_id,
    listing_type,
    sale_price,
    total_commission,
    owner_share,
    buyer_share,
  });

  return commission.toObject();
};
