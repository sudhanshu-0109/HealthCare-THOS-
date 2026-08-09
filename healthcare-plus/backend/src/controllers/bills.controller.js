/**
 * controllers/bills.controller.js — Billing history and revenue controllers.
 */

import * as billsService from '../services/bills.service.js';

export const getMyBills = async (req, res) => {
  const { status, sourceType, page, limit } = req.query;
  const result = await billsService.getMyBills(req.user.id, {
    status,
    sourceType,
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 20,
  });
  res.json({ success: true, data: result });
};

export const getBill = async (req, res) => {
  const bill = await billsService.getBillById(
    req.params.id,
    req.user.id,
    req.user.role,
    req.hospitalId
  );
  res.json({ success: true, data: bill });
};

export const getBillReceipt = async (req, res) => {
  const receipt = await billsService.getBillReceipt(req.params.id, req.user.id);
  res.json({ success: true, data: receipt });
};

export const getHospitalRevenue = async (req, res) => {
  const { from, to, groupBy } = req.query;
  const result = await billsService.getHospitalRevenue(req.hospitalId, { from, to, groupBy });
  res.json({ success: true, data: result });
};

// Pharmacy orders controller
export const getMyOrders = async (req, res) => {
  const { default: service } = await import('../services/pharmacyOrders.service.js');
  const orders = await service.getMyOrders(req.user.id);
  res.json({ success: true, data: orders });
};

export const createPharmacyOrder = async (req, res) => {
  const { prescriptionId } = req.body;
  const { default: service } = await import('../services/pharmacyOrders.service.js');
  const order = await service.createOrderFromPrescription(prescriptionId, req.body.hospitalId, req.user.id);
  res.status(201).json({ success: true, data: order });
};

export const confirmPharmacyOrder = async (req, res) => {
  const { items } = req.body;
  const { default: service } = await import('../services/pharmacyOrders.service.js');
  const result = await service.pharmacistMatchAndConfirm(req.params.id, req.user.id, items);
  res.json({ success: true, data: result });
};

export const advancePharmacyOrderStatus = async (req, res) => {
  const { status } = req.body;
  const { default: service } = await import('../services/pharmacyOrders.service.js');
  const order = await service.advanceStatus(req.params.id, status, req.user.id, req.hospitalId);
  res.json({ success: true, data: order });
};

export const getHospitalOrders = async (req, res) => {
  const { status } = req.query;
  const { default: service } = await import('../services/pharmacyOrders.service.js');
  const orders = await service.getHospitalOrders(req.hospitalId, { status });
  res.json({ success: true, data: orders });
};

// Lab fulfillment controller
export const confirmLabRequest = async (req, res) => {
  const { finalItems } = req.body;
  const { default: service } = await import('../services/labFulfillment.service.js');
  const result = await service.confirmLabRequest(req.params.id, req.user.id, { finalItems });
  res.json({ success: true, data: result });
};

export const uploadLabReport = async (req, res) => {
  const { reportFileUrl, resultSummary, labRequestItemId } = req.body;
  const { default: service } = await import('../services/labFulfillment.service.js');
  const report = await service.uploadReport(req.params.id, { reportFileUrl, resultSummary, labRequestItemId }, req.user.id);
  res.status(201).json({ success: true, data: report });
};

export const getHospitalLabRequests = async (req, res) => {
  const { status } = req.query;
  const { default: service } = await import('../services/labFulfillment.service.js');
  const requests = await service.getHospitalLabRequests(req.hospitalId, { status });
  res.json({ success: true, data: requests });
};

export const getMyLabResults = async (req, res) => {
  const { default: service } = await import('../services/labFulfillment.service.js');
  const results = await service.getMyLabResults(req.user.id);
  res.json({ success: true, data: results });
};
