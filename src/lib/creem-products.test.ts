import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getCreemPlanProductId,
  getPlanIdForCreemProductId,
  requireCreemProductId,
  validateCreemProductsConfiguration,
} from "./creem-products.ts";

test("maps paid plans to product IDs from environment variables", () => {
  process.env.CREEM_STARTER_PRODUCT_ID = "prod_starter_env";
  process.env.CREEM_PRO_PRODUCT_ID = "prod_pro_env";

  assert.deepEqual(validateCreemProductsConfiguration(), []);
  assert.equal(getCreemPlanProductId("starter"), "prod_starter_env");
  assert.equal(getCreemPlanProductId("pro"), "prod_pro_env");
  assert.equal(getPlanIdForCreemProductId("prod_starter_env"), "starter");
  assert.equal(getPlanIdForCreemProductId("prod_pro_env"), "pro");
  assert.equal(requireCreemProductId("pro"), "prod_pro_env");
});

test("reports the missing product environment variable by name", () => {
  delete process.env.CREEM_STARTER_PRODUCT_ID;
  process.env.CREEM_PRO_PRODUCT_ID = "prod_pro_env";

  assert.deepEqual(validateCreemProductsConfiguration(), [
    "CREEM_STARTER_PRODUCT_ID",
  ]);
  assert.throws(() => requireCreemProductId("starter"), {
    message: "Missing Creem product environment variable: CREEM_STARTER_PRODUCT_ID",
  });
});

test("does not expose unknown products or plans", () => {
  process.env.CREEM_STARTER_PRODUCT_ID = "prod_starter_env";
  process.env.CREEM_PRO_PRODUCT_ID = "prod_pro_env";

  assert.equal(getPlanIdForCreemProductId("prod_unknown"), null);
  assert.equal(getCreemPlanProductId("enterprise" as "starter" | "pro"), null);
});
