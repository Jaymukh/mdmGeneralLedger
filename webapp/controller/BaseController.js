sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"murphy/mdm/mdmGLAccount/shared/serviceCall",
	"sap/ui/core/Fragment",
	"sap/m/MessageToast",
	"sap/ui/model/json/JSONModel",
	"sap/m/ColumnListItem",
	"sap/m/Label",
	"sap/m/Token",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/syncStyleClass"
], function (Controller, ServiceCall, Fragment, MessageToast, JSONModel, ColumnListItem, Label, Token, Filter, FilterOperator,
	syncStyleClass) {
	"use strict";

	return Controller.extend("murphy.mdm.mdmGLAccount.controller.BaseController", {

		constructor: function () {
			this.serviceCall = new ServiceCall();
		},

		getModel: function (sModelName) {
			return this.getOwnerComponent().getModel(sModelName);
		},

		getRouter: function () {
			return sap.ui.core.UIComponent.getRouterFor(this);
		},

		getText: function (sText, aArgs = []) {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle().getText(sText, aArgs);
		},

		createEntityId: function (sEntityType) {
			var objParam = {
				url: "/mdmccpc/entity-service/entities/entity/create",
				hasPayload: true,
				type: "POST",
				data: {
					"entityType": "GL",
					"parentDTO": {
						"customData": {
							"business_entity": {
								"entity_type_id": "41004",
								"created_by": this.getView().getModel("userManagementModel").getProperty("/data/user_id"),
								"modified_by": this.getView().getModel("userManagementModel").getProperty("/data/user_id"),
								"is_draft": true
							}
						}
					}
				}
			};

			return this.serviceCall.handleServiceRequest(objParam);
		},

		createGLEntity: function () {
			var oGLModel = this.getModel("GL"),
				oAppModel = this.getModel("App"),
				oChangeRequest = Object.assign({}, oAppModel.getProperty("/changeReq")),
				oSka1 = Object.assign({}, oAppModel.getProperty("/ska1")),
				oSkb1 = Object.assign({}, oAppModel.getProperty("/skb1")),
				oCska = Object.assign({}, oAppModel.getProperty("/cska")),
				oCskb = Object.assign({}, oAppModel.getProperty("/cskb")),
				oDate = new Date(),
				sDate = `${oDate.getFullYear()}-${("0" + (oDate.getMonth() + 1) ).slice(-2)}-${("0" + oDate.getDate()).slice(-2)}`;

			this.clearSidePanelDetails();
			this.clearAllButtons();

			/*For Testing Purpose*/
			oAppModel.setProperty("/edit", true);
			oAppModel.setProperty("/crEdit", true);

			this.getView().setBusy(true);
			this.createEntityId().then(oData => {
				var oBusinessEntity = oData.result.generalLedgerDTOs[0].commonEntityDTO.customBusinessDTO;
				oSka1.entity_id = oBusinessEntity.entity_id;
				oSka1.erdat = sDate;
				oSkb1.entity_id = oBusinessEntity.entity_id;
				oCska.entity_id = oBusinessEntity.entity_id;
				oCskb.entity_id = oBusinessEntity.entity_id;

				oChangeRequest.change_request_id = 50001;
				oChangeRequest.reason = "";
				oChangeRequest.timeCreation = `${("0" + oDate.getHours()).slice(-2)}:${("0" + oDate.getMinutes()).slice(-2)}`;
				oChangeRequest.dateCreation = sDate;
				oChangeRequest.change_request_by = oBusinessEntity.hasOwnProperty("created_by") ? oBusinessEntity.created_by : {};
				oChangeRequest.modified_by = oBusinessEntity.hasOwnProperty("modified_by") ? oBusinessEntity.modified_by : {};
				this.getModel("AuditLogModel").setProperty("/details/businessID", oBusinessEntity.entity_id);

				oGLModel.setData({
					workflowID: "",
					ChangeRequest: oChangeRequest,
					Ska1: oSka1,
					TableRows: {
						Skat: [],
						Skb1: [],
						Cska: [],
						Cskb: []
					},
					Skb1: oSkb1,
					Cska: oCska,
					Cskb: oCskb
				});
				oAppModel.setProperty("/edit", true);
				oAppModel.setProperty("/crEdit", true);
				oAppModel.setProperty("/saveButton", true);
				oAppModel.setProperty("/checkButton", true);
				oAppModel.setProperty("/previousPage", "");
				this.getView().setBusy(false);
				this.filterCRReasons(oChangeRequest.change_request_id, "GL_CR_REASON");
			}, oError => {
				MessageToast.show("Failed to create entity id, please try again");
				this.getView().setBusy(false);
			});
		},

		getGlCrStatistics: function () {
			var oChangeRequestsModel = this.getModel("ChangeRequestsModel"),
				objParam = {
					url: "/mdmccpc/change-request-service/changerequests/changerequest/statistics/get",
					hasPayload: true,
					type: "POST",
					data: {
						"userId": this.getModel("userManagementModel").getProperty("/data/user_id"),
						"changeRequestSearchDTO": {
							"entityType": "GL"
						}
					}
				};

			this.serviceCall.handleServiceRequest(objParam).then(function (oData) {
				oChangeRequestsModel.setProperty("/Statistics", oData.result);
			});
		},

		getFilterValues: function (sFilterBarId) {
			var oFilterValues = {};
			this.byId(sFilterBarId).getAllFilterItems().forEach(oFilterItem => {
				var oControl = oFilterItem.getControl();
				switch (oControl.getMetadata().getName()) {
				case "sap.m.Input":
					oFilterValues[oFilterItem.getName()] = oControl.getValue();
					break;
				case "sap.m.ComboBox":
					oFilterValues[oFilterItem.getName()] = oControl.getSelectedKey();
					break;
				}
			});
			return oFilterValues;
		},

		clearFilterValues: function (sFilterBarId) {
			this.byId(sFilterBarId).getAllFilterItems().forEach(oFilterItem => {
				var oControl = oFilterItem.getControl();
				switch (oControl.getMetadata().getName()) {
				case "sap.m.Input":
					oControl.setValue("");
					break;
				case "sap.m.ComboBox":
					oControl.setSelectedKey("");
					break;
				}
			});
		},

		onTypeMissmatch: function (oEvent) {
			var sFileTypes = oEvent.getSource().getFileType().toString();
			MessageToast.show("Selected file type is not support to upload. Supported file types are " + sFileTypes);
		},

		dateFormater: function (sDateTime) {
			var sDate = sDateTime.split("T")[0] ? sDateTime.split("T")[0] : "";
			var sTime = sDateTime.split("T")[1] ? sDateTime.split("T")[1].split(".")[0] : "";
			return sDate + " at " + sTime;
		},

		auditLogOldDateFormat: function (sValue, attrName) {
			if (attrName === "created_on" || attrName === "modified_on") {
				sValue = (sValue && sValue !== "null") ? this.getDateFromTime(sValue) : "";
			}
			return "Old : " + ((sValue && sValue !== "null") ? sValue : "");
		},

		auditLogNewDateFormat: function (sValue, attrName) {
			if (attrName === "created_on" || attrName === "modified_on") {
				sValue = (sValue && sValue !== "null") ? this.getDateFromTime(sValue) : "";
			}
			return "New : " + ((sValue && sValue !== "null") ? sValue : "");
		},

		getDateFromTime: function (sValue) {
			var date = new Date(1970, 0, 1);
			date.setSeconds(sValue.slice(0, 10));
			var sDate = ("" + date.getDate()).length === 1 ? "0" + date.getDate() : date.getDate();
			var sMonth = ("" + (date.getMonth() + 1)).length === 1 ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1);
			var sYear = date.getFullYear();
			var sHour = ("" + date.getHours()).length === 1 ? "0" + date.getHours() : date.getHours();
			var sMinute = ("" + date.getMinutes()).length === 1 ? "0" + date.getMinutes() : date.getMinutes();
			date.getMinutes();
			var sSeconds = ("" + date.getSeconds()).length === 1 ? "0" + date.getSeconds() : date.getSeconds();
			date.getSeconds();
			return sMonth + "-" + sDate + "-" + sYear + " at " + sHour + ":" + sMinute + ":" + sSeconds;
		},

		onSelectCheckBox: function (oEvent) {
			var oSource = oEvent.getSource(),
				sKey = oSource.getCustomData()[0].getKey(),
				aModel = sKey.split(">");
			this.getModel(aModel[0]).setProperty(aModel[1], oEvent.getParameter("selected") ? "X" : "");
		},
		
		onSelectTableCheckBox: function(oEvent){
			var oSource = oEvent.getSource(),
				sKey = oSource.getCustomData()[0].getKey(),
				aModel = sKey.split(">"),
				sPath = oEvent.getSource().getBindingContext(aModel[0]).getPath();
			this.getModel(aModel[0]).setProperty(sPath + aModel[1], oEvent.getParameter("selected") ? "X" : "");
		},

		checkFormReqFields: function (sFormId) {
			var oForm = this.byId(sFormId),
				bValid = true,
				aMessages = [];
			oForm.getContent().forEach(oItem => {
				var sClass = oItem.getMetadata().getName();
				if (sClass === "sap.m.Input" || sClass === "sap.m.ComboBox" || sClass === "sap.m.TextArea") {
					if (oItem.getRequired()) {
						var sValue = "";
						switch (sClass) {
						case "sap.m.Input":
						case "sap.m.TextArea":
							sValue = oItem.getValue();
							break;
						case "sap.m.ComboBox":
							sValue = oItem.getSelectedKey();
							break;
						}
						oItem.setValueState(sValue ? "None" : "Error");
						if (!sValue && oItem.getLabels().length) {
							aMessages.push(`${oItem.getLabels()[0].getText()} field is missing`);
						}
						bValid = bValid && sValue ? true : false;
					}
				}
			});
			return {
				bValid: bValid,
				message: aMessages
			};
		},

		onPressAddComment: function () {
			this.getView().byId("commentVBoxID").setVisible(true);
		},

		onChnageLogSwitchChangeReq: function (oEvent) {
			var oList = this.getView().byId("idAuditLogListChangeRequest");
			oList.setVisible(oEvent.getParameter("state"));
		},

		onAddComment: function (oParameter) {
			this.getView().setBusy(true);
			var sValue = oParameter.hasOwnProperty("Control") ? oParameter.Control.getValue() : oParameter.Comment;
			var objParamCreate = {
				url: "/mdmccpc/change-request-service/changerequests/changerequest/comments/add",
				type: "POST",
				hasPayload: true,
				data: {
					"parentCrDTOs": [{
						"crCommentDTOs": [{
							"entity_id": oParameter.EntityID,
							"note_desc": sValue,
							"note_by": {
								"user_id": this.getView().getModel("userManagementModel").getProperty("/data/user_id")
							}
						}]
					}]
				}
			};
			this.serviceCall.handleServiceRequest(objParamCreate).then(function (oDataResp) {
					if (oParameter.hasOwnProperty("Control")) {
						oParameter.Control.setValue("");
					}
					this.getView().setBusy(false);
					if (oDataResp.result) {
						this.getAllCommentsForCR(oParameter.EntityID);
					}
				}.bind(this),
				function () {
					this.getView().setBusy(false);
					MessageToast.show("Failed to add Comment, Please Try after some time.");
				}.bind(this)
			);

		},

		onAddCommentCRList: function () {
			this.onAddComment({
				EntityID: this.getModel("AuditLogModel").getProperty("/details/businessID"),
				Control: this.getView().byId("changeReruestListCommentBoxId")
			});
		},

		getAllCommentsForCR: function (sEntityID) {
			this.getView().setBusy(true);
			var oCommentsModel = this.getModel("CommentsModel"),
				oAuditLogModel = this.getModel("AuditLogModel");
			var objParamCreate = {
				url: "/mdmccpc/change-request-service/changerequests/changerequest/comments/get",
				type: 'POST',
				hasPayload: true,
				data: {
					"parentCrDTOs": [{
						"crDTO": {
							"entity_id": sEntityID
						}
					}]
				}
			};
			this.serviceCall.handleServiceRequest(objParamCreate).then(function (oDataResp) {
					this.getView().setBusy(false);
					if (oDataResp.result) {
						oCommentsModel.setData(oDataResp.result);
						if (!oAuditLogModel.getProperty("/details")) {
							oAuditLogModel.setProperty("/details", {});
						}
						var nCommentCount = oDataResp.result.parentCrDTOs[0].crCommentDTOs ? oDataResp.result.parentCrDTOs[0].crCommentDTOs.length : 0;
						oAuditLogModel.setProperty("/details/commentCount", nCommentCount);
					}
				}.bind(this),
				function () {
					this.getView().setBusy(false);
					oCommentsModel.setData([]);
					oAuditLogModel.setProperty("/details/commentCount", 0);
					MessageToast.show("Failed to get all Comment, Please Try after some time.");
				}.bind(this)
			);
		},

		getAllDocumentsForCR: function (sEntityID) {
			this.getView().setBusy(true);
			var oAttachModel = this.getModel("AttachmentsModel"),
				oAuditLogModel = this.getModel("AuditLogModel");
			var objParamCreate = {
				url: "/mdmccpc/change-request-service/changerequests/changerequest/documents/all",
				type: 'POST',
				hasPayload: true,
				data: {
					"parentCrDTOs": [{
						"crDTO": {
							"entity_id": sEntityID
						}
					}]
				}
			};
			this.serviceCall.handleServiceRequest(objParamCreate).then(function (oDataResp) {
					this.getView().setBusy(false);
					if (oDataResp.result) {
						oAttachModel.setData(oDataResp.result);
						if (!oAuditLogModel.getProperty("/details")) {
							oAuditLogModel.setProperty("/details", {});
						}
						var nAttachmentCount = oDataResp.result.documentInteractionDtos ? oDataResp.result.documentInteractionDtos.length : 0;
						oAuditLogModel.setProperty("/details/attachmentCount", nAttachmentCount);
					}
				}.bind(this),
				function () {
					this.getView().setBusy(false);
					oAttachModel.setData([]);
					oAuditLogModel.setProperty("/details/attachmentCount", 0);
					MessageToast.show("Failed to get all Documents, Please Try after some time.");
				}.bind(this)
			);
		},

		getWorkFlowForCR: function (sCRID) {
			this.getView().setBusy(true);
			var oWorkFlowModel = this.getModel("WorkFlowModel");
			var objParamCreate = {
				url: "/mdmccpc/workflow-service/workflows/tasks/workbox/changerequest/logs",
				type: "POST",
				hasPayload: true,
				data: {
					"changeRequestDTO": {
						"change_request_id": sCRID
					}
				}
			};
			this.serviceCall.handleServiceRequest(objParamCreate).then(function (oDataResp) {
					this.getView().setBusy(false);
					if (oDataResp.result && oDataResp.result.workflowAuditLogDTO) {
						oWorkFlowModel.setData(oDataResp.result.workflowAuditLogDTO);
					}
				}.bind(this),
				function () {
					this.getView().setBusy(false);
					oWorkFlowModel.setData([]);
					MessageToast.show("Failed to get Workflow Status, Please Try after some time.");

				}.bind(this)
			);
		},

		getAuditLogsForCR: function (sCrID) {
			this.getView().setBusy(true);
			var oAuditLogModel = this.getModel("AuditLogModel");
			var objParamCreate = {
				url: "/mdmccpc/audit-service/audits/audit/entity/all",
				type: 'POST',
				hasPayload: true,
				data: {
					"changeRequestLogs": [{
						"changeRequestId": sCrID
					}]
				}
			};
			this.serviceCall.handleServiceRequest(objParamCreate).then(function (oDataResp) {
					this.getView().setBusy(false);
					if (oDataResp.result) {
						var nNewCount = oDataResp.result.changeRequestLogs.filter(function (e) {
							return e.changeLogType === "New";
						}).length;

						var nChangedCount = oDataResp.result.changeRequestLogs.filter(function (e) {
							return e.changeLogType === "Changed";
						}).length;

						var nDeleteCount = oDataResp.result.changeRequestLogs.filter(function (e) {
							return e.changeLogType === "Deleted";
						}).length;

						if (!oAuditLogModel.getProperty("/details")) {
							oAuditLogModel.setProperty("/details", {});
						}
						oAuditLogModel.setProperty("/details/newCount", nNewCount);
						oAuditLogModel.setProperty("/details/changedCount", nChangedCount);
						oAuditLogModel.setProperty("/details/deleteCount", nDeleteCount);

						var result = {};

						for (var {
								attributeCategoryId,
								attributeName,
								changeLogTypeId,
								changeRequestId,
								change_request_log_id,
								logBy,
								logDate,
								newValue,
								oldValue,
								changeLogType
							}
							of oDataResp.result.changeRequestLogs) {
							if (!result[logBy]) {
								result[logBy] = [];
							}
							result[logBy].push({
								attributeCategoryId,
								attributeName,
								changeLogTypeId,
								changeRequestId,
								change_request_log_id,
								logDate,
								newValue,
								oldValue,
								changeLogType
							});
						}

						var changeLog = [];

						for (var i = 0; i < Object.keys(result).length; i++) {
							var obj = {
								logBy: Object.keys(result)[i],
								logs: result[Object.keys(result)[i]]
							};
							changeLog.push(obj);
						}
						oAuditLogModel.setProperty("/items", changeLog);
						oAuditLogModel.refresh(true);
					}
				}.bind(this),
				function () {
					this.getView().setBusy(false);
					oAuditLogModel.setProperty("/items", []);
					MessageToast.show("Failed to get Audit Logs, Please Try after some time.");

				}.bind(this)
			);
		},

		onChangeFileUpload: function (oEvent) {
			this.getView().setBusy(true);
			var oAuditLogModel = this.getView().getModel("AuditLogModel"),
				sEntityID = oAuditLogModel.getProperty("/details/businessID");

			if (sEntityID) {
				var aFiles = oEvent.getParameter("files"),
					oFile = aFiles[0];
				if (aFiles && oFile) {
					var reader = new FileReader();
					reader.onload = function (oReaderEVent) {
						var sResult = `data:${oFile.type};base64,${btoa(oReaderEVent.target.result)}`;
						var objParamCreate = {
							url: "/mdmccpc/change-request-service/changerequests/changerequest/documents/upload",
							type: "POST",
							hasPayload: true,
							data: {
								"documentInteractionDtos": [{
									"attachmentEntity": {
										"attachment_name": oFile.name,
										"attachment_description": oFile.name,
										"attachment_link": "",
										"mime_type": oFile.type,
										"file_name": oFile.name,
										"attachment_type_id": "11001",
										"created_by": this.getView().getModel("userManagementModel").getProperty("/data/user_id"),
										"file_name_with_extension": oFile.name
									},
									"entityType": "GL",
									"businessEntity": {
										"entity_id": sEntityID
									},
									"fileContent": sResult
								}]
							}
						};
						this.serviceCall.handleServiceRequest(objParamCreate).then(function (oDataResp) {
								this.getView().setBusy(false);
								if (oDataResp.result) {
									var sFileName = oDataResp.result.documentInteractionDtos[0].attachmentEntity.attachment_name;
									this.getAllDocumentsForCR(sEntityID);
									MessageToast.show(sFileName + " Uploaded Successfully for " + sEntityID + " Entity ID");
								}
							}.bind(this),
							function () {
								this.getView().setBusy(false);
								MessageToast.show("Error in File Uploading");
							}.bind(this)
						);
					}.bind(this);
					reader.readAsBinaryString(oFile);
				}
			}
		},

		onDeleteAttachment: function (oEvent) {
			var oFileData = oEvent.getSource().getBindingContext("AttachmentsModel").getObject();
			var oAuditLogModel = this.getView().getModel("AuditLogModel"),
				sEntityID = oAuditLogModel.getProperty("/details/businessID");
			this.getView().setBusy(true);
			var objParamCreate = {
				url: "/mdmccpc/change-request-service/changerequests/changerequest/documents/delete",
				type: "POST",
				hasPayload: true,
				data: {
					"documentInteractionDtos": [{
						"attachmentEntity": {
							"attachment_id": oFileData.attachmentEntity.attachment_id,
							"dms_ref_id": oFileData.attachmentEntity.dms_ref_id
						},
						"entityType": "COST_CENTER",
						"businessEntity": {
							"entity_id": sEntityID
						},
						"fileContent": ""
					}]
				}
			};
			this.serviceCall.handleServiceRequest(objParamCreate).then(function (oDataResp) {
					this.getView().setBusy(false);
					if (oDataResp.result) {
						this.getAllDocumentsForCR(sEntityID);
						MessageToast.show("Attachment Deleted Successfully.");
					}
				}.bind(this),
				function (oError) {
					this.getView().setBusy(false);
					MessageToast.show("Failed to delete the attachment");
				}.bind(this)
			);
		},

		onDocumentDownload: function (oEvent) {
			var sDocID = oEvent.getSource().getProperty("documentId"),
				sDocName = oEvent.getSource().getProperty("fileName");
			var objParamCreate = {
				url: "/mdmccpc/change-request-service/changerequests/changerequest/documents/download",
				type: "POST",
				hasPayload: true,
				data: {
					"documentInteractionDtos": [{
						"attachmentEntity": {
							"dms_ref_id": sDocID
						}
					}]
				}
			};
			this.serviceCall.handleServiceRequest(objParamCreate).then(function (oDataResp) {
					this.getView().setBusy(false);
					if (oDataResp) {
						var a = document.createElement("a");
						a.href = oDataResp;
						a.download = sDocName;
						a.click();
					}
				}.bind(this),
				function () {
					this.getView().setBusy(false);
					MessageToast.show("Error in File Downloading");
				}.bind(this)
			);
		},

		getSidePanelDetails: function (oCRObject) {
			var oAudLogModel = this.getView().getModel("AuditLogModel");
			if (!oAudLogModel.getProperty("/details")) {
				oAudLogModel.setProperty("/details", {});
			}

			oAudLogModel.setProperty("/details/desc", oCRObject.crDTO.change_request_desc);
			oAudLogModel.setProperty("/details/businessID", oCRObject.crDTO.entity_id);
			oAudLogModel.setProperty("/details/ChangeRequestID", oCRObject.crDTO.change_request_id);

			//Get Comments, Documents, Logs, WorkFlow
			this.getAllCommentsForCR(oCRObject.crDTO.entity_id);
			this.getAllDocumentsForCR(oCRObject.crDTO.entity_id);
			this.getAuditLogsForCR(oCRObject.crDTO.entity_id);
			this.getWorkFlowForCR(oCRObject.crDTO.change_request_id);
		},

		clearAllButtons: function () {
			var oAppModel = this.getModel("App");
			oAppModel.setProperty("/edit", false);
			oAppModel.setProperty("/editButton", false);
			oAppModel.setProperty("/saveButton", false);
			oAppModel.setProperty("/approveButton", false);
			oAppModel.setProperty("/rejectButton", false);
			oAppModel.setProperty("/submitButton", false);
			oAppModel.setProperty("/previousPage", null);
			oAppModel.setProperty("/erpPreview", false);
			oAppModel.setProperty("/crPreview", false);
		},

		clearSidePanelDetails: function () {
			var oCommentsModel = this.getModel("CommentsModel"),
				oAttachModel = this.getModel("AttachmentsModel"),
				oAudLogModel = this.getView().getModel("AuditLogModel"),
				oWorkFlowModel = this.getModel("WorkFlowModel");

			oCommentsModel.setData([]);
			oAttachModel.setData([]);
			oWorkFlowModel.setData([]);
			oAudLogModel.setProperty("/details", {});
			oAudLogModel.setProperty("/details/desc", "");
			oAudLogModel.setProperty("/details/businessID", "");
			oAudLogModel.setProperty("/details/ChangeRequestID", "");
		},

		formatCR_Entiry_ID: function (sCRId, sEntityID) {
			var sID = "";
			if (sCRId) {
				sID = sCRId;
			} else {
				sID = "T-" + sEntityID;
			}
			return sID;
		},

		formatCR_Org_Name: function (sOrgNo) {
			var sText = "";
			if (sOrgNo) {
				sText = "Organization: " + sOrgNo + ", (no description available)";
			} else {
				sText = "Organization: (no description available)";
			}
			return sText;
		},

		clearCRTableModel: function () {
			var oChangeRequestsModel = this.getModel("ChangeRequestsModel");
			oChangeRequestsModel.setProperty("/ChangeRequests", []);
			oChangeRequestsModel.setProperty("/SelectedPageKey", 0);
			oChangeRequestsModel.setProperty("/RightEnabled", false);
			oChangeRequestsModel.setProperty("/LeftEnabled", false);
			oChangeRequestsModel.setProperty("/TotalCount", 0);
		},

		onValueHelpRequested: function (oEvent) {
			this.getView().setBusy(true);
			this._oInput = oEvent.getSource();
			var aCustomData = this._oInput.getCustomData();
			var oData = {
				cols: []
			};

			aCustomData.forEach(oCustData => {
				switch (oCustData.getKey()) {
				case "title":
					oData.title = oCustData.getValue();
					break;
				case "table":
					oData.table = oCustData.getValue();
					break;
				case "inputKey":
					this._sKey = oCustData.getValue();
					oData.key = oCustData.getValue();
					break;
				case "inputText":
					oData.text = oCustData.getValue();
					break;
				default:
					var col = {
						"label": oCustData.getValue(),
						"template": oCustData.getKey()
					};
					oData.cols.push(col);
				}
			});

			this.oColModel = new JSONModel(oData);
			this.oTableDataModel = new JSONModel({
				item: []
			});

			var oConfigFilters = {},
				aCols = oData.cols,
				objParamCreate = {
					url: "/mdmccpc/config-service/configurations/configuration/filter",
					type: "POST",
					hasPayload: true,
					data: {
						"configType": oData.table,
						"currentPage": 1,
						"maxResults": 100,
						configFilters: oConfigFilters
					}
				};

			if (oData.table === "vw_cskt" || oData.table === "vw_cepct") {
				oConfigFilters["spras"] = "EN";
			}

			this.serviceCall.handleServiceRequest(objParamCreate).then(function (oDataResp) {
				if (oDataResp.result && oDataResp.result.modelMap) {
					var obj = {};
					obj[oData["key"]] = "";
					obj[oData["text"]] = "";
					oDataResp.result.modelMap.unshift(obj);
					this.oTableDataModel.setProperty("/item", oDataResp.result.modelMap);
					this.oTableDataModel.refresh();
				}
			}.bind(this));

			Fragment.load({
				name: "murphy.mdm.mdmGLAccount.fragments.valueHelpSuggest",
				controller: this
			}).then(function name(oFragment) {
				this._oValueHelpDialog = oFragment;
				this.getView().addDependent(this._oValueHelpDialog);
				syncStyleClass(this.getOwnerComponent().getContentDensityClass(), this.getView(), this._oValueHelpDialog);
				this._oValueHelpDialog.setModel(this.oColModel, "oViewModel");

				var oFilterBar = this._oValueHelpDialog.getFilterBar();
				oFilterBar.setFilterBarExpanded(true);

				oFilterBar.setModel(this.oColModel, "columns");

				this._oValueHelpDialog.getTableAsync().then(function (oTable) {
					oTable.setModel(this.oTableDataModel);
					oTable.setModel(this.oColModel, "columns");

					if (oTable.bindRows) {
						oTable.bindAggregation("rows", "/item");
					}

					if (oTable.bindItems) {
						oTable.bindAggregation("items", "/item", function () {
							return new ColumnListItem({
								cells: aCols.map(function (column) {
									return new Label({
										text: "{" + column.colKey + "}",
										wrapping: true
									});
								})
							});
						});
					}

					this._oValueHelpDialog.update();
				}.bind(this));
				this._oValueHelpDialog.open();
				this.getView().setBusy(false);
			}.bind(this));
		},

		onValueHelpOkPress: function (oEvent) {
			var aToken = oEvent.getParameter("tokens"),
				oVal = aToken[0].getCustomData()[0].getValue();
			if (this._sKey.split("/").length > 1) {
				this._oInput.setValue(oVal[this._sKey.split("/")[0]][this._sKey.split("/")[1]]);
			} else {
				this._oInput.setValue(oVal[this._sKey]);
			}
			this._oValueHelpDialog.close();
		},

		onValueHelpCancelPress: function () {
			this._oValueHelpDialog.close();
		},

		onValueHelpAfterClose: function () {
			this._oValueHelpDialog.destroy();
		},

		onFilterBarSearch: function (oEvent) {
			var aSelectionSet = oEvent.getParameter("selectionSet");
			var aFilters = aSelectionSet.reduce(function (aResult, oControl) {
				if (oControl.getValue()) {
					aResult.push(new Filter({
						// path: oControl.getName(),
						path: oControl.getModel("oViewModel").getProperty("/cols/" + oControl.getId().split("-")[oControl.getId().split("-").length -
							1] + "/template"),
						operator: FilterOperator.Contains,
						value1: oControl.getValue()
					}));
				}

				return aResult;
			}, []);

			this._filterTable(new Filter({
				filters: aFilters,
				and: true
			}));
		},

		_filterTable: function (oFilter) {
			var oValueHelpDialog = this._oValueHelpDialog;

			oValueHelpDialog.getTableAsync().then(function (oTable) {
				if (oTable.bindRows) {
					oTable.getBinding("rows").filter(oFilter);
				}

				if (oTable.bindItems) {
					oTable.getBinding("items").filter(oFilter);
				}

				oValueHelpDialog.update();
			});
		},

		filterCRReasons: function (sRequestType, sAppName) {
			var oDropDownModel = this.getModel("Dropdowns"),
				aTaxonomyReasons = oDropDownModel.getProperty("/TAXONOMY") || [],
				aCustCRReasons = aTaxonomyReasons.filter(oItem => {
					return oItem.taxonomyType === sAppName;
				}),
				aFinalReasons = [];
			switch (sRequestType) {
			case 50001: //Create 
				aFinalReasons = aCustCRReasons.filter(oItem => {
					return oItem.groupName === "CREATE";
				});
				break;
			case 50002: //Edit 
				aFinalReasons = aCustCRReasons.filter(oItem => {
					return oItem.groupName === "EDIT";
				});
				break;
			case 50003: //Copy 
				aFinalReasons = aCustCRReasons.filter(oItem => {
					return oItem.groupName === "COPY";
				});
				break;
			case 50004: //Block
				aFinalReasons = aCustCRReasons.filter(oItem => {
					return oItem.groupName === "BLOCK";
				});
				break;
			case 50005: //Delete
				aFinalReasons = aCustCRReasons.filter(oItem => {
					return oItem.groupName === "DELETE";
				});
				break;
			}
			oDropDownModel.setProperty("/crReasons", aFinalReasons);
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

	});
});