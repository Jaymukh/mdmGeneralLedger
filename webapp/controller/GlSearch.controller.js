sap.ui.define([
	"murphy/mdm/mdmGLAccount/controller/BaseController",
	"sap/ui/core/Fragment",
	"sap/m/MessageToast",
	"sap/m/MessageBox"
], function (BaseController, Fragment, MessageToast, MessageBox) {
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
			this.clearAllButtons();
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
			this.serviceCall.handleServiceRequest(objParam).then(oData => {
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
			var oContext = oEvent.getSource().getBindingContext("SearchGLModel"),
				oButton = oEvent.getSource();
			if (!this._pPopover) {
				this._pPopover = Fragment.load({
					id: this.getView().getId(),
					name: "murphy.mdm.mdmGLAccount.fragments.OverflowPopUp",
					controller: this
				}).then(oPopover => {
					this.getView().addDependent(oPopover);
					return oPopover;
				});
			}

			this._pPopover.then(function (oPopover) {
				oPopover.bindElement({
					path: oContext.getPath(),
					model: "SearchGLModel"
				});
				oPopover.openBy(oButton);
			});
		},

		onGetGlDetails: function (oEvent) {
			let oGL = oEvent.getSource().getBindingContext("SearchGLModel").getObject(),
				oAppModel = this.getModel("App");

			this.clearAllButtons();
			this.getGLDetails(oGL.generalLedgerSka1DTO.saknr);
			oAppModel.setProperty("/editButton", true);
			oAppModel.setProperty("/previousPage", "GL_SEARCH");
			oAppModel.setProperty("/erpPreview", true);
			this.getRouter().getTargets().display("GlCreate");
		},

		getGLDetails: function (sGlAccount) {
			var objParamCreate = {
				url: "/mdmccpc/entity-service/entities/entity/get",
				type: "POST",
				hasPayload: true,
				data: {
					"entitySearchType": "GET_BY_GENERAL_LEDGER_ID",
					"entityType": "GL",
					"parentDTO": {
						"customData": {
							"fin_ska1": {
								"saknr": sGlAccount
							}
						}
					}
				}
			};
			return this.serviceCall.handleServiceRequest(objParamCreate);
		},

		onPreviewGL: function (oEvent) {
			var oGL = oEvent.getSource().getBindingContext("SearchGLModel").getObject();
			this.navToGLPage(oGL.generalLedgerSka1DTO.saknr, "PREVIEW");
		},

		onEditGL: function (oEvent) {
			var oGL = oEvent.getSource().getBindingContext("SearchGLModel").getObject();
			this.navToGLPage(oGL.generalLedgerSka1DTO.saknr, "EDIT");
			this.closeSearchAction();
		},

		onCopyGL: function (oEvent) {
			var oGL = oEvent.getSource().getBindingContext("SearchGLModel").getObject();
			this.navToGLPage(oGL.generalLedgerSka1DTO.saknr, "COPY");
			this.closeSearchAction();
		},

		onBlockGL: function (oEvent) {
			var oGL = oEvent.getSource().getBindingContext("SearchGLModel").getObject();
			MessageBox.confirm(
				`Are you sure, you wan to block G/L Account ${oGL.generalLedgerSka1DTO.saknr} - ${oGL.generalLedgerSka1DTO.txt20} ?`, {
					actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
					onClose: sAction => {
						if (sAction === "OK") {
							this.navToGLPage(oGL.generalLedgerSka1DTO.saknr, "BLOCK");
						}
					}
				});
			this.closeSearchAction();
		},

		onDeleteGL: function (oEvent) {
			var oGL = oEvent.getSource().getBindingContext("SearchGLModel").getObject();
			MessageBox.confirm(
				`Are you sure, you wan to delete G/L Account ${oGL.generalLedgerSka1DTO.saknr} - ${oGL.generalLedgerSka1DTO.txt20} ?`, {
					actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
					onClose: sAction => {
						if (sAction === "OK") {
							this.navToGLPage(oGL.generalLedgerSka1DTO.saknr, "DELETE");
						}
					}
				});
			this.closeSearchAction();
		},

		closeSearchAction: function () {
			this._pPopover.then(oPopover => {
				oPopover.close();
			});
		},

		navToGLPage: function (sGlAccount, sAction) {
			let oAppModel = this.getModel("App"),
				oGLModel = this.getModel("GL"),
				oChangeRequest = Object.assign({}, oAppModel.getProperty("/changeReq")),
				oSka1 = Object.assign({}, oAppModel.getProperty("/ska1")),
				aSkat = [],
				aSkb1 = [],
				aCska = [],
				aCskb = [],
				oDate = new Date(),
				sMonth = oDate.getMonth() + 1,
				sMinutes = oDate.getMinutes();

			this.clearAllButtons();
			this.getView().setBusy(true);
			this.getGLDetails(sGlAccount)
				.then(oData => {
					oData.result.generalLedgerDTOs.forEach(oItem => {
						if (oItem.hasOwnProperty("generalLedgerSka1DTO") && oItem.generalLedgerSka1DTO) {
							oSka1 = oItem.generalLedgerSka1DTO;
						}
						if (oItem.hasOwnProperty("generalLedgerSkatDTO") && oItem.generalLedgerSkatDTO) {
							aSkat = oItem.generalLedgerSkatDTO;
						}
						if (oItem.hasOwnProperty("generalLedgerSkb1DTO") && oItem.generalLedgerSkb1DTO) {
							aSkb1 = oItem.generalLedgerSkb1DTO;
						}
						if (oItem.hasOwnProperty("generalLedgerCskaDTO") && oItem.generalLedgerCskaDTO) {
							aCska = oItem.generalLedgerCskaDTO;
						}
						if (oItem.hasOwnProperty("generalLedgerCskbDTO") && oItem.generalLedgerCskbDTO) {
							aCskb = oItem.generalLedgerCskbDTO;
						}
					});
					//Get GL Name & Long Text
					var oEnSkat = aSkat.find(oItem => {
						return oItem.spras === "EN";
					});
					oAppModel.setProperty("/glName", oEnSkat ? oEnSkat.txt20 : "");
					oAppModel.setProperty("/glLongText", oEnSkat ? oEnSkat.txt50 : "");

					switch (sAction) {
					case "EDIT":
					case "COPY":
						oChangeRequest.change_request_id = sAction === "COPY" ? 50003 : 50002;
						oAppModel.setProperty("/saveButton", true);
						oAppModel.setProperty("/checkButton", true);
						oAppModel.setProperty("/edit", true);
						oAppModel.setProperty("/crEdit", true);
						oAppModel.setProperty("/appTitle", "Create G/L Account");
						if (sAction === "COPY") {
							oSka1.saknr = "";
						}
						break;
					case "BLOCK":
						oChangeRequest.change_request_id = 50004;
						oAppModel.setProperty("/saveButton", true);
						oAppModel.setProperty("/checkButton", true);
						oAppModel.setProperty("/edit", false);
						oAppModel.setProperty("/crEdit", true);
						oAppModel.setProperty("/appTitle", "Block G/L Account");
						break;
					case "DELETE":
						oChangeRequest.change_request_id = 50005;
						oAppModel.setProperty("/saveButton", true);
						oAppModel.setProperty("/checkButton", true);
						oAppModel.setProperty("/edit", false);
						oAppModel.setProperty("/crEdit", true);
						oAppModel.setProperty("/appTitle", "Delete G/L Account");
						break;
					case "PREVIEW":
						oAppModel.setProperty("/editButton", true);
						oAppModel.setProperty("/appTitle", "Create G/L Account");
						oAppModel.setProperty("/previousPage", "ALL_GL");
						oAppModel.setProperty("/erpPreview", true);
					}

					oGLModel.setData({
						workflowID: "",
						ChangeRequest: {},
						Ska1: oSka1,
						TableRows: {
							Skat: aSkat,
							Skb1: aSkb1,
							Cska: aCska,
							Cskb: aCskb
						},
						Skb1: Object.assign({}, oAppModel.getProperty("/skb1")),
						Cska: Object.assign({}, oAppModel.getProperty("/cska")),
						Cskb: Object.assign({}, oAppModel.getProperty("/cskb"))
					});
					this.getRouter().getTargets().display("GlCreate");
					this.getView().setBusy(false);

					//Create Entity ID for Cost Center
					if (sAction !== "PREVIEW") {
						this.getView().setBusy(true);
						this.createEntityId().then(oData => {
							var oBusinessEntity = oData.result.generalLedgerDTOs[0].commonEntityDTO.customBusinessDTO,
								sEntityId = oBusinessEntity.entity_id;
							oChangeRequest.reason = "";
							oChangeRequest.timeCreation = oDate.getHours() + ":" + (sMinutes < 10 ? "0" + sMinutes : sMinutes);
							oChangeRequest.dateCreation = oDate.getFullYear() + "-" + (sMonth < 10 ? "0" + sMonth : sMonth) + "-" + oDate.getDate();
							oChangeRequest.change_request_by = oBusinessEntity.hasOwnProperty("created_by") ? oBusinessEntity.created_by : {};
							oChangeRequest.modified_by = oBusinessEntity.hasOwnProperty("modified_by") ? oBusinessEntity.modified_by : {};
							oSka1.entity_id = sEntityId;

							oGLModel.setData({
								workflowID: "",
								ChangeRequest: oChangeRequest,
								Ska1: oSka1,
								TableRows: {
									Skat: aSkat,
									Skb1: aSkb1,
									Cska: aCska,
									Cskb: aCskb
								},
								Skb1: Object.assign({}, oAppModel.getProperty("/skb1")),
								Cska: Object.assign({}, oAppModel.getProperty("/cska")),
								Cskb: Object.assign({}, oAppModel.getProperty("/cskb")),
							});
							this.filterCRReasons(oChangeRequest.change_request_id, "GL_CR_REASON");
							this.getView().setBusy(false);
						}, oError => {
							this.getView().setBusy(false);
							MessageToast.show("Entity ID not created. Please try after some time");
							this.getRouter().getTargets().display("GlSearch");
							oAppModel.setProperty("/appTitle", "Search Cost Center");
						});
					}
				}, oError => {
					MessageToast.show("Failed to fetch Cost Center Details, please try again");
					this.getView().setBusy(false);
				});
		}

	});

});