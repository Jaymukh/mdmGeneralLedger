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

		getStatusOfCr: function (sValue) {
			return sValue ? "Closed" : "Open";
		},

		getDateofCr: function (sDateText) {
			var sResultDate = "";
			if (sDateText) {
				var oDate = new Date(sDateText);
				sResultDate = `${("0" + (oDate.getUTCMonth() + 1) ).slice(-2)}-${("0" + oDate.getUTCDate()).slice(-2)}-${oDate.getUTCFullYear()}`;
			}
			return sResultDate;
		},

		onSelectCRinTable: function (oEvent) {
			var oCRObject = oEvent.getParameter("listItem").getBindingContext("ChangeRequestsModel").getObject();
			this.getSidePanelDetails(oCRObject);
			var oToggleBtn = this.getView().byId("slideToggleButtonID");
			oToggleBtn.firePress({
				pressed: true
			});
			oToggleBtn.setPressed(true);
		},

		handleCRSideMenu: function (oEvent) {
			var bPressed = oEvent.getParameter("pressed");
			var oDynamicSideContent = this.getView().byId("idGLCRDynamicPage");
			oEvent.getSource().setIcon(bPressed ? "sap-icon://arrow-right" : "sap-icon://arrow-left");
			oDynamicSideContent.setShowSideContent(bPressed);
		},

		onGLCRPress: function (oEvent) {
			var oCRObject = oEvent.getSource().getBindingContext("ChangeRequestsModel").getObject(),
				oAppModel = this.getModel("App"),
				oGLModel = this.getModel("GL"),
				oSka1 = Object.assign({}, oAppModel.getProperty("/ska1")),
				aSkat = [],
				aSkb1 = [],
				aCska = [],
				aCskb = [],
				oChangeRequest = Object.assign({}, oAppModel.getProperty("/changeReq")),
				oUserData = this.getModel("userManagementModel").getData(),
				sWorkFlowId = "",
				sChangeRequestId = oCRObject.crDTO.change_request_id,
				oEntityParam = {
					url: "/mdmccpc/entity-service/entities/entity/get",
					type: "POST",
					hasPayload: true,
					data: {
						"entitySearchType": "GL_GET_BY_ENTITY_ID",
						"entityType": "GL",
						"parentDTO": {
							"customData": {
								"business_entity": {
									"entity_id": oCRObject.crDTO.entity_id
								}
							}
						}
					}
				};
			this.clearAllButtons();
			//Get Change Request Details
			var oParamChangeReq = {
				url: "/mdmccpc/change-request-service/changerequests/changerequest/page",
				type: 'POST',
				hasPayload: true,
				data: {
					"crSearchType": "GET_BY_CR_ID",
					"parentCrDTOs": [{
						"crDTO": {
							"change_request_id": sChangeRequestId
						}
					}],
					"userId": this.getView().getModel("userManagementModel").getProperty("/data/user_id")
				}
			};

			this.serviceCall.handleServiceRequest(oParamChangeReq).then(oData => {
				var oChangeReq = oData.result.parentCrDTOs[0].crDTO;
				if (oChangeReq.isClaimable &&
					(oChangeReq.change_request_type_id === 50002 || oChangeReq.change_request_type_id === 50001) &&
					oUserData.role.indexOf('approv') === -1) {
					oAppModel.setProperty("/editButton", true);
				}
				if (oChangeReq.isClaimable &&
					(oUserData.role.indexOf('approv') !== -1 || oUserData.role.indexOf('stew') !== -1)) {
					oAppModel.setProperty("/approveButton", true);
					oAppModel.setProperty("/rejectButton", true);
				}
				if (oChangeReq.isClaimable && (oUserData.role.indexOf('req') !== -1)) {
					oAppModel.setProperty("/withDrawButton", true);
				}
			});

			this.getView().setBusy(true);
			this.serviceCall.handleServiceRequest(oEntityParam).then(oData => {
				oData.result.generalLedgerDTOs.forEach(oItem => {
					if (oItem.hasOwnProperty("generalLedgerSka1DTO") && oItem.generalLedgerSka1DTO) {
						oSka1 = oItem.generalLedgerSka1DTO;
					}
					if (oItem.hasOwnProperty("generalLedgerSkatDTOs") && oItem.generalLedgerSkatDTOs) {
						aSkat = oItem.generalLedgerSkatDTOs;
					}
					if (oItem.hasOwnProperty("generalLedgerSkb1DTOs") && oItem.generalLedgerSkb1DTOs) {
						aSkb1 = oItem.generalLedgerSkb1DTOs;
					}
					if (oItem.hasOwnProperty("generalLedgerCskaDTOs") && oItem.generalLedgerCskaDTOs) {
						aCska = oItem.generalLedgerCskaDTOs;
					}
					if (oItem.hasOwnProperty("generalLedgerCskbDTOs") && oItem.generalLedgerCskbDTOs) {
						aCskb = oItem.generalLedgerCskbDTOs;
					}

					if (oItem.hasOwnProperty("changeRequestDTO") && oItem.changeRequestDTO) {
						oChangeRequest.desc = oItem.changeRequestDTO.change_request_desc;
						oChangeRequest.priority = oItem.changeRequestDTO.change_request_priority_id;
						if (oItem.changeRequestDTO.change_request_due_date) {
							var sDueDate = oItem.changeRequestDTO.change_request_due_date.substring(0, 10).replaceAll("-", "");
							oChangeRequest.dueDate = sDueDate;
						}
						oChangeRequest.reason = oItem.changeRequestDTO.change_request_reason_id;
						oChangeRequest.status = "";
						oChangeRequest.createdBy = oItem.changeRequestDTO.change_request_by;
						oChangeRequest.currWrkItem = "";
						oChangeRequest.dateCreation = oItem.changeRequestDTO.change_request_date;
						if (oItem.changeRequestDTO.change_request_date) {
							var sReqTime = oItem.changeRequestDTO.change_request_date.substring(11, 16);
							oChangeRequest.timeCreation = sReqTime;
						}
						oChangeRequest.change_request_by = oItem.changeRequestDTO.change_request_by;
						oChangeRequest.modified_by = oItem.changeRequestDTO.modified_by;
						oChangeRequest.isClaimable = oItem.changeRequestDTO.isClaimable;
						sWorkFlowId = oItem.changeRequestDTO.workflow_task_id;
					}
				});
				
				//Get GL Name & Long Text
				var oEnSkat = aSkat.find(oItem => {
					return oItem.spras === "EN";
				});
				oAppModel.setProperty("/glName", oEnSkat ? oEnSkat.txt20 : "");
				oAppModel.setProperty("/glLongText", oEnSkat ? oEnSkat.txt50 : "");
				oAppModel.setProperty("/appTitle", "Create G/L Account");
				oGLModel.setData({
					workflowID: sWorkFlowId,
					crID: sChangeRequestId,
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
					Cskb: Object.assign({}, oAppModel.getProperty("/cskb"))
				});

				this.clearSidePanelDetails();
				this.getSidePanelDetails(oCRObject);
				this.getRouter().getTargets().display("GlCreate");
				this.getView().setBusy(false);
			}, oError => {
				this.getView().setBusy(false);
				MessageToast.show("Failed to fetch CR Details, please try again later");
			});
		},

		onSelectChnageReqPage: function () {
			var sPageNo = this.getView().getModel("ChangeRequestsModel").getProperty("/SelectedPageKey");
			this.getAllCCChangeRequests(sPageNo);
		},

		onSelectChnageReqPageLeft: function () {
			var sPageNo = this.getView().getModel("ChangeRequestsModel").getProperty("/SelectedPageKey");
			this.getAllCCChangeRequests(sPageNo - 1);
		},

		onSelectChnageReqPageRight: function () {
			var sPageNo = this.getView().getModel("ChangeRequestsModel").getProperty("/SelectedPageKey");
			this.getAllCCChangeRequests(sPageNo + 1);
		},

	});

});