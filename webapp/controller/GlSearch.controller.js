sap.ui.define([
	"murphy/mdm/mdmGLAccount/controller/BaseController",
	"sap/ui/core/Fragment",
	"sap/m/MessageToast"
], function (BaseController, Fragment, MessageToast) {
	"use strict";

	return BaseController.extend("murphy.mdm.mdmGLAccount.controller.GlSearch", {

		onInit: function () {
			var oParameters = {
				sPageNo: 1
			};
			this.GLSearch(oParameters);
		},

		onNavtoCreateGL: function () {
			let oAppModel = this.getModel("App");
			this.createGLEntity();
			this.getRouter().getTargets().display("GlCreate");
			oAppModel.setProperty("/appTitle", this.getText("GlCreate"));
		},

		GLSearch: function (oParameters) {
			var oSearchModel = this.getModel("SearchGLModel"),
				iPageNo = oParameters.hasOwnProperty("sPageNo") ? oParameters.sPageNo : 1;
			oSearchModel.setProperty("/LeftEnabled", false);
			oSearchModel.setProperty("/RightEnabled", false);

			//Get filter details
			var oFilterValues = this.getFilterValues("idGLSearchFB"),
				oObjectParam = {
					"entitySearchType": "GET_BY_GENERAL_LEDGER_FILTERS",
					"entityType": "GL",
					"generalLedgerSearchDTO": {},
					"currentPage": iPageNo
				};

			oFilterValues.generalLedgerSearchType = "SEARCH_BY_GEN_DETAIL";
			oObjectParam.generalLedgerSearchDTO = oFilterValues;

			var objParam = {
				url: "/mdmccpc/entity-service/entities/entity/get",
				type: "POST",
				hasPayload: true,
				data: oObjectParam
			};
			
			this.getView().setBusy(true);
			this.serviceCall.handleServiceRequest(objParam).then(oData=>{
				var aResultDataArr = oData.result.generalLedgerDTOs,
					aPageJson = [];
				oData.result.totalRecords = aResultDataArr[0].totalCount;

				if (aResultDataArr[0].currentPage === 1) {
					//Calculate no of pages available 
					for (var i = 0; i < aResultDataArr[0].totalPageCount; i++) {
						aPageJson.push({
							key: i + 1,
							text: i + 1
						});
					}
					oSearchModel.setProperty("/PageData", aPageJson);
				}
				oSearchModel.setProperty("/SelectedPageKey", aResultDataArr[0].currentPage);
				oSearchModel.setProperty("/RightEnabled", aResultDataArr[0].totalPageCount > aResultDataArr[0].currentPage ? true : false);
				oSearchModel.setProperty("/LeftEnabled", aResultDataArr[0].currentPage > 1 ? true : false);
				oSearchModel.setProperty("/GLAccounts", aResultDataArr);
				this.getView().setBusy(false);
			}, oError => {
				//Error Handler
				this.getView().setBusy(false);
				MessageToast.show("Error in getting GL Accounts");
			});
		},

		onGLAction: function (oEvent) {
			var oContext = oEvent.getSource().getBindingContext("SearchCCModel"),
				oButton = oEvent.getSource();
			if (!this._pPopover) {
				this._pPopover = Fragment.load({
					id: this.getView().getId(),
					name: "murphy.mdm.costProfit.mdmCostProfitCenter.fragments.OverflowPopUp",
					controller: this
				}).then(oPopover => {
					this.getView().addDependent(oPopover);
					return oPopover;
				});
			}

			this._pPopover.then(function (oPopover) {
				oPopover.bindElement({
					path: oContext.getPath(),
					model: "SearchCCModel"
				});
				oPopover.openBy(oButton);
			});
		},

		onGetCostCenterDetails: function (oEvent) {
			let oCostCenter = oEvent.getSource().getBindingContext("SearchCCModel").getObject(),
				oAppModel = this.getModel("App");

			this.clearAllButtons();
			this.getCostCenterDetails(oCostCenter.costCenterCsksDTO.kostl);
			oAppModel.setProperty("/editButton", true);
			oAppModel.setProperty("/previousPage", "CC_SEARCH");
			oAppModel.setProperty("/erpPreview", true);
			this.getRouter().getTargets().display("CostCenterCreate");
		}

	});

});