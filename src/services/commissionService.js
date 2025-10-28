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

  const owner_share = total_commission / 2;
  const client_share = total_commission / 2;

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
  });

  return commission.toObject();
};
