sap.ui.define([
	"murphy/mdm/mdmGLAccount/controller/BaseController",
	"sap/m/MessageToast"
], function (BaseController, MessageToast) {
	"use strict";

	return BaseController.extend("murphy.mdm.mdmGLAccount.controller.GlChangeRequests", {

		onInit: function () {
			this.getAllGLChangeRequests(1);
		},

		onSearchGLCR: function () {
			this.getAllGLChangeRequests(1);
		},

		getAllGLChangeRequests: function (nPageNo = 1) {
			var oFilters = this.getCRSearchFilters(nPageNo);
			this.clearCRTableModel();
			oFilters.entityType = "GL";
			this.getAllChangeRequest(nPageNo, oFilters);
		},

		getAllChangeRequest: function (nPageNo, oFilters) {
			var oChangeRequestsModel = this.getModel("ChangeRequestsModel");
			var objParam = {
				url: "/mdmccpc/change-request-service/changerequests/changerequest/filters/get",
				hasPayload: true,
				type: "POST",
				data: {
					"crSearchType": "GET_CR_BY_GENERAL_LEDGER_FILTERS",
					"currentPage": nPageNo,
					"changeRequestSearchDTO": oFilters
				}
			};

			this.getView().setBusy(true);
			this.serviceCall.handleServiceRequest(objParam).then(oData => {
				if (oData.result.currentPage === 1) {
					var aPageJson = [],
						iTotalPage = oData.result.totalPageCount;

					if (oData.result.totalPageCount === 0) {
						iTotalPage = oData.result.maxPageSize > 0 ? Math.ceil(oData.result.totalCount / oData.result.maxPageSize) : 1;
					}
					for (var i = 0; i < iTotalPage; i++) {
						aPageJson.push({
							key: i + 1,
							text: i + 1
						});
					}
					oChangeRequestsModel.setProperty("/PageData", aPageJson);
				}

				oChangeRequestsModel.setProperty("/ChangeRequests", oData.result.parentCrDTOs);
				oChangeRequestsModel.setProperty("/SelectedPageKey", oData.result.currentPage);
				oChangeRequestsModel.setProperty("/RightEnabled", oData.result.totalPageCount > oData.result.currentPage ? true : false);
				oChangeRequestsModel.setProperty("/LeftEnabled", oData.result.currentPage > 1 ? true : false);
				oChangeRequestsModel.setProperty("/TotalCount", oData.result.totalCount);
				this.getView().setBusy(false);
			}, oError => {
				//Error Handler
				this.getView().setBusy(false);
				MessageToast.show("Error in getting Change Requests");
			});
		},

		getCRSearchFilters: function (nPageNo = 1) {
			var oCRSearchData = Object.assign({}, this.getModel("ChangeRequestsModel").getData()),
				sUserId = this.getModel("userManagementModel").getProperty("/data/user_id"),
				oFilters = Object.create(null);

			oCRSearchData.DateFrom = oCRSearchData.DateFrom ? oCRSearchData.DateFrom : new Date(0);
			oCRSearchData.DateTo = oCRSearchData.DateTo ? oCRSearchData.DateTo : new Date();

			oFilters.dateRangeFrom =
				`${oCRSearchData.DateFrom.getFullYear()}-${("0" + (oCRSearchData.DateFrom.getMonth() + 1) ).slice(-2)}-${("0" + oCRSearchData.DateFrom.getDate()).slice(-2)}`;
			oFilters.dateRangeTo =
				`${oCRSearchData.DateTo.getFullYear()}-${("0" + (oCRSearchData.DateTo.getMonth() + 1) ).slice(-2)}-${("0" + oCRSearchData.DateTo.getDate()).slice(-2)}`;
			oFilters.createdBy = oCRSearchData.Show === "01" ? "" : sUserId;
			oFilters.isClaimed = oCRSearchData.Show === "01" || oCRSearchData.Show === "02" ? "" : true;
			oFilters.isCrClosed = oCRSearchData.Show === "04" ? true : oCRSearchData.Show === "03" ? false : "";
			oFilters.approvedEntityId = oCRSearchData.Customer;
			oFilters.AccountType = oCRSearchData.AccountType;
			oFilters.Name = oCRSearchData.Name;
			oFilters.glAccount = oCRSearchData.glAccount;
			oFilters.chartOfAccount = oCRSearchData.chartOfAccount;
			oFilters.listOfCRSearchCondition = [
				"GET_CR_BY_ADDRESS",
				"GET_CR_CREATED_BY_USER_ID",
				"GET_CR_BY_DATE_RANGE",
				"GET_CR_BY_ENTITY",
				"GET_CR_BY_COMPANY_CODE",
				"GET_CR_PROCESSED_BY_USER_ID",
				"GET_CR_BY_ACCOUNT_TYPE",
				"GET_CR_BY_NAME",
				"GET_CR_BY_GL_ACCOUNT",
				"GET_CR_BY_CHART_OF_ACCOUNT"
			];

			return oFilters;
		},

		clearCRTableModel: function () {
			var oChangeRequestsModel = this.getModel("ChangeRequestsModel");
			oChangeRequestsModel.setProperty("/ChangeRequests", []);
			oChangeRequestsModel.setProperty("/SelectedPageKey", 0);
			oChangeRequestsModel.setProperty("/RightEnabled", false);
			oChangeRequestsModel.setProperty("/LeftEnabled", false);
			oChangeRequestsModel.setProperty("/TotalCount", 0);
		}

	});

});