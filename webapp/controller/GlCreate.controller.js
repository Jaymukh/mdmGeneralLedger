sap.ui.define([
	"murphy/mdm/mdmGLAccount/controller/BaseController",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageToast",
	"sap/m/Dialog",
	"sap/m/Button",
	"sap/m/List",
	"sap/m/TextArea",
	"sap/m/StandardListItem",
], function (BaseController, Filter, FilterOperator, MessageToast, Dialog, Button, List, TextArea, StandardListItem) {
	"use strict";

	return BaseController.extend("murphy.mdm.mdmGLAccount.controller.GlCreate", {
		onChangeName: function (oEvent) {
			var sName = oEvent.getSource().getValue(),
				oGLModel = this.getModel("GL"),
				oGL = oGLModel.getData(),
				oSkat = Object.assign({}, this.getModel("App").getProperty("/skat"));

			var oEnSkat = oGL.TableRows.Skat.find(oItem => {
				return oItem.spras === "E";
			});

			if (oEnSkat) {
				oEnSkat.txt50 = sName;
			} else {
				oSkat.entity_id = oGL.Ska1.entity_id;
				oSkat.ktopl = oGL.Ska1.ktopl;
				oSkat.spras = "EN";
				oSkat.saknr = oGL.Ska1.saknr;
				oSkat.txt20 = sName;
				oGL.TableRows.Skat.push(oSkat);
			}
			oGLModel.setData(oGL);
		},

		onChangeMText: function (oEvent) {
			var sName = oEvent.getSource().getValue(),
				oGLModel = this.getModel("GL"),
				oGL = oGLModel.getData(),
				oSkat = Object.assign({}, this.getModel("App").getProperty("/skat"));

			var oEnSkat = oGL.TableRows.Skat.find(oItem => {
				return oItem.spras === "E";
			});

			if (oEnSkat) {
				oEnSkat.txt50 = sName;
			} else {
				oSkat.entity_id = oGL.Ska1.entity_id;
				oSkat.ktopl = oGL.Ska1.ktopl;
				oSkat.spras = "EN";
				oSkat.saknr = oGL.Ska1.saknr;
				oSkat.txt50 = sName;
				oGL.TableRows.Skat.push(oSkat);
			}
			oGLModel.setData(oGL);
		},

		onAddDescription: function (oEvent) {
			var oGL = this.getModel("GL"),
				oGLData = oGL.getData(),
				oSkat = Object.assign({}, this.getModel("App").getProperty("/skat"));
			oGLData.TableRows.Skat.push(oSkat);
			oSkat.entity_id = oGLData.Ska1.entity_id;
			oGL.setData(oGLData);
		},

		onDeleteDesc: function (oEvent) {
			var sPath = oEvent.getSource().getBindingContext("GL").getPath(),
				oGLModel = this.getModel("GL"),
				oGLData = oGLModel.getData(),
				iIndex = Number(sPath.replace("/TableRows/Skat/", ""));
			if (iIndex > -1) {
				oGLData.TableRows.Skat.splice(iIndex, 1);
				oGLModel.setData(oGLData);
			}
		},

		onAddBukrs: function () {
			if (this.checkFormReqFields("idCompForm").bValid &&
				this.checkFormReqFields("idControlData").bValid ) {
				var oGL = this.getModel("GL"),
					oGLData = oGL.getData(),
					oSkb1 = Object.assign({}, this.getModel("App").getProperty("/skb1"));

				oSkb1.entity_id = oGLData.Ska1.entity_id;
				oGLData.TableRows.Skb1.push(Object.assign({}, oGLData.Skb1));
				oGLData.Skb1 = Object.assign({}, oSkb1);
				oGL.setData(oGLData);
			} else {
				MessageToast.show("Please Fill Mandatory Fields");
			}

		},
		
		onEditBukrs: function(oEvent){
			var oContext = oEvent.getSource().getBindingContext("GL"),
				sPath = oContext.getPath(),
				oBukrs = oContext.getObject(),
				oGLModel = this.getView().getModel("GL"),
				oGLData = oGLModel.getData(),
				iIndex = Number(sPath.replace("/TableRows/Skb1/", ""));
			if (iIndex > -1) {
				oGLData.TableRows.Skb1.splice(iIndex, 1);
				oGLData.Skb1 = Object.assign({}, oBukrs);
				oGLModel.setData(oGLData);
			}
		},
		
		onDeleteBukrs: function(oEvent){
			var sPath = oEvent.getSource().getBindingContext("GL").getPath(),
				oGLModel = this.getModel("GL"),
				oGLData = oGLModel.getData(),
				iIndex = Number(sPath.replace("/TableRows/Skb1/", ""));
			if (iIndex > -1) {
				oGLData.TableRows.Skb1.splice(iIndex, 1);
				oGLModel.setData(oGLData);
			}
		},
		
		onAddCO: function(oEvent){
			var oGL = this.getModel("GL"),
				oGLData = oGL.getData(),
				oCskb = Object.assign({}, this.getModel("App").getProperty("/cskb"));
			oGLData.TableRows.Cskb.push(oCskb);
			oCskb.entity_id = oGLData.Ska1.entity_id;
			oCskb.kstar = oGLData.Ska1.saknr;
			oCskb.func_area = oGLData.Ska1.func_area;
			oGL.setData(oGLData);
		},
		
		onDeleteCO: function(oEvent){
			var sPath = oEvent.getSource().getBindingContext("GL").getPath(),
				oGLModel = this.getModel("GL"),
				oGLData = oGLModel.getData(),
				iIndex = Number(sPath.replace("/TableRows/Cskb/", ""));
			if (iIndex > -1) {
				oGLData.TableRows.Cskb.splice(iIndex, 1);
				oGLModel.setData(oGLData);
			}
		},

		onSaveCR: function () {
			if (this.onCheckCR()) {
				var oGLModel = this.getModel("GL"),
					oGLData = oGLModel.getData(),
					oAppModel = this.getModel("App"),
					oFormData = {
						"entityType": "GL",
						"parentDTO": {
							"customData": {
								"fin_ska1": Object.assign({}, oGLData.Ska1),
								"fin_skb1": {},
								"fin_skat": {},
								"fin_cskb": {},
								"fin_cska": {}
							}
						}
					};

				oGLData.TableRows.Skat.forEach((oItem, iIndex) => {
					oItem.saknr = oGLData.Ska1.saknr;
					oItem.entity_id = oGLData.Ska1.entity_id;
					oItem.ktopl = oGLData.Ska1.ktopl;
					oFormData.parentDTO.customData.fin_skat[iIndex + 1] = oItem;
				});

				var oObjParamCreate = {
					url: "/mdmccpc/entity-service/entities/entity/update",
					hasPayload: true,
					data: oFormData,
					type: "POST"
				};

				this.getView().setBusy(true);
				this.serviceCall.handleServiceRequest(oObjParamCreate).then(
					oDataResp => {
						//Success Handle after save CR
						this.getView().setBusy(false);
						this.getAllCommentsForCR(oFormData.parentDTO.customData.fin_ska1.entity_id);
						this.getAllDocumentsForCR(oFormData.parentDTO.customData.fin_ska1.entity_id);
						this.getAuditLogsForCR(oFormData.parentDTO.customData.fin_ska1.entity_id);
						this.clearAllButtons();
						oAppModel.setProperty("/edit", false);
						oAppModel.setProperty("/submitButton", true);
						oAppModel.setProperty("/editButton", true);
						MessageToast.show("Draft Version Created Successfully");
					},
					oError => {
						//Error Hanlder while saving CR
						this.getView().setBusy(false);
						MessageToast.show("Error In Creating Draft Version");
					});
			}
		},

		onCheckCR: function () {
			var aMessages = [],
				bValid = true;
			if (bValid) {
				var aForms = ["idChangeReqForm", "idGLDetails"];
				aForms.forEach(sForm => {
					var oMessages = this.checkFormReqFields(sForm);
					if (!oMessages.bValid) {
						aMessages = aMessages.concat(this.checkFormReqFields(sForm).message);
						bValid = false;
					}
				});
			}
			if (aMessages.length && !bValid) {
				var oList = new List();
				aMessages.forEach(sMessage => {
					oList.addItem(new StandardListItem({
						title: sMessage
					}));
				});
				this.sMessageDialog = new Dialog({
					title: "Missing Fields",
					content: oList,
					endButton: new Button({
						text: "Close",
						press: () => {
							this.sMessageDialog.close();
							this.sMessageDialog.destroy();
						}
					})
				});
				this.getView().addDependent(this.sMessageDialog);
				this.sMessageDialog.open();
			} else {
				MessageToast.show("Validation Successful");
				bValid = true;
			}
			return bValid;
		},

		onEditClick: function () {
			var oGLModel = this.getModel("GL"),
				oAppModel = this.getModel("App"),
				oChangeRequest = Object.assign({}, oAppModel.getProperty("/changeReq")),
				oGLData = oGLModel.getData(),
				oDate = new Date(),
				sDate = `${oDate.getFullYear()}-${("0" + (oDate.getMonth() + 1) ).slice(-2)}-${("0" + oDate.getDate()).slice(-2)}`;
			if (oAppModel.getProperty("/erpPreview")) {
				oGLData.ChangeRequest = oChangeRequest;
				this.clearAllButtons();
				this.getView().setBusy(true);
				this.createEntityId().then(oData => {
					var oBusinessEntity = oData.result.generalLedgerDTOs[0].commonEntityDTO.customBusinessDTO,
						sEntityId = oBusinessEntity.entity_id,
						oAudLogModel = this.getView().getModel("AuditLogModel");
					if (!oAudLogModel.getProperty("/details")) {
						oAudLogModel.setProperty("/details", {});
					}

					oAudLogModel.setProperty("/details/desc", "");
					oAudLogModel.setProperty("/details/businessID", sEntityId);
					oAudLogModel.setProperty("/details/ChangeRequestID", "");

					oGLData.Ska1.entity_id = sEntityId;
					oGLData.ChangeRequest.change_request_id = 50001;
					oGLData.ChangeRequest.reason = "";
					oGLData.ChangeRequest.timeCreation = `${("0" + oDate.getHours()).slice(-2)}:${("0" + oDate.getMinutes()).slice(-2)}`;
					oGLData.ChangeRequest.dateCreation = sDate;
					oGLData.ChangeRequest.change_request_by = oBusinessEntity.hasOwnProperty("created_by") ? oBusinessEntity.created_by : {};
					oGLData.ChangeRequest.modified_by = oBusinessEntity.hasOwnProperty("modified_by") ? oBusinessEntity.modified_by : {};
					this.getModel("AuditLogModel").setProperty("/details/businessID", oBusinessEntity.entity_id);

					oGLModel.setData(oGLData);
					oAppModel.setProperty("/edit", true);
					oAppModel.setProperty("/submitButton", false);
					oAppModel.setProperty("/editButton", false);
					oAppModel.setProperty("/saveButton", true);
					oAppModel.setProperty("/crEdit", true);
					this.filterCRReasons(oGLData.ChangeRequest.change_request_id, "GL_CR_REASON");
					this.getView().setBusy(false);
				}, oError => {
					this.getView().setBusy(false);
					MessageToast.show("Entity ID not created. Please try after some time");
				});
			} else {
				this.clearAllButtons();
				oAppModel.setProperty("/edit", true);
				oAppModel.setProperty("/submitButton", false);
				oAppModel.setProperty("/editButton", false);
				oAppModel.setProperty("/saveButton", true);
				oAppModel.setProperty("/crEdit", true);
			}
		},

		onSubmitCR: function () {
			if (this.onCheckCR()) {
				/*this.getView().setBusy(true);
				var objParamSubmit = {
					url: "/mdmccpc/workflow-service/workflows/tasks/task/action",
					type: 'POST',
					hasPayload: true,
					data: {
						"operationType": "CREATE",
						"changeRequestDTO": {
							"entity_type_id": "41003",
							"entity_id": this.getModel("CostCenter").getProperty("/Csks/entity_id")
						}
					}
				};
				this.serviceCall.handleServiceRequest(objParamSubmit).then(function (oDataResp) {
					this.getView().setBusy(false);
					MessageToast.show("Submission Successful");
					this._CreateCRID();
					this.getView().getModel("Customer").refresh(true);
				}.bind(this), function (oError) {
					this.getView().setBusy(false);
					var sError = "";
					var aError = [];
					if (oError.responseJSON.result && oError.responseJSON.result.workboxCreateTaskResponseDTO && oError.responseJSON.result.workboxCreateTaskResponseDTO
						.response.EXT_MESSAGES.MESSAGES.item &&
						oError.responseJSON.result.workboxCreateTaskResponseDTO.response.EXT_MESSAGES.MESSAGES.item.length > 0) {
						oError.responseJSON.result.workboxCreateTaskResponseDTO.response.EXT_MESSAGES.MESSAGES.item.forEach(function (oItem) {
							sError = sError + oItem.MESSAGE + "\n";
							aError.push({
								ErrorMessage: oItem.MESSAGE
							});
						});
					} else if (!oError.responseJSON.result) {
						aError.push({
							ErrorMessage: oError.responseJSON.error
						});
						sError = oError.responseJSON.error;
					}
					this.getView().getModel("Customer").refresh(true);
					MessageToast.show(sError, {
						duration: 6000,
						width: "100%"
					});
				}.bind(this));*/
				this._createTask();
			}
		},

		_createTask: function () {
			var oGLData = this.getModel("GL").getData(),
				oData = {
					"workboxCreateTaskRequestDTO": {
						"listOfProcesssAttributes": [{
							"customAttributeTemplateDto": [{
								"processName": "STANDARD",
								"key": "description",
								"label": "Description",
								"processType": "",
								"isEditable": true,
								"isActive": true,
								"isMandatory": true,
								"isEdited": 2,
								"attrDes": "",
								"value": oGLData.TableRows.Skat[0].txt20,
								"dataType": null,
								"valueList": null,
								"attachmentType": null,
								"attachmentSize": null,
								"attachmentName": null,
								"attachmentId": null,
								"dataTypeKey": 0,
								"dropDownType": null,
								"url": null,
								"taskId": null,
								"origin": null,
								"attributePath": null,
								"dependantOn": null,
								"rowNumber": 0,
								"tableAttributes": null,
								"tableContents": null,
								"isDeleted": false,
								"isRunTime": null,
								"isVisible": null
							}, {
								"processName": "MDGGLWorkflow",
								"key": "c97d3ieh41gbc",
								"label": "CountryCode",
								"processType": null,
								"isEditable": true,
								"isActive": true,
								"isMandatory": true,
								"isEdited": 2,
								"attrDes": "Country Code",
								"value": "US",
								"dataType": "INPUT",
								"valueList": [],
								"attachmentType": null,
								"attachmentSize": null,
								"attachmentName": null,
								"attachmentId": null,
								"dataTypeKey": 0,
								"dropDownType": null,
								"url": null,
								"taskId": null,
								"origin": "Process",
								"attributePath": null,
								"dependantOn": null,
								"rowNumber": 0,
								"tableAttributes": null,
								"tableContents": null,
								"isDeleted": false,
								"isRunTime": null,
								"isVisible": null
							}, {
								"processName": "MDGGLWorkflow",
								"key": "7f4ch31j8ca0i",
								"label": "AccountGroup",
								"processType": null,
								"isEditable": true,
								"isActive": true,
								"isMandatory": true,
								"isEdited": 2,
								"attrDes": "Account Group",
								"value": oGLData.Ska1.ktoks,
								"dataType": "INPUT",
								"valueList": [],
								"attachmentType": null,
								"attachmentSize": null,
								"attachmentName": null,
								"attachmentId": null,
								"dataTypeKey": 0,
								"dropDownType": null,
								"url": null,
								"taskId": null,
								"origin": "Process",
								"attributePath": null,
								"dependantOn": null,
								"rowNumber": 0,
								"tableAttributes": null,
								"tableContents": null,
								"isDeleted": false,
								"isRunTime": false,
								"isVisible": null
							}, {
								"processName": "MDGGLWorkflow",
								"key": "84e34fh16d51d",
								"label": "Data Domain",
								"processType": null,
								"isEditable": true,
								"isActive": true,
								"isMandatory": true,
								"isEdited": 2,
								"attrDes": "Data Domain",
								"value": "GL",
								"dataType": "INPUT",
								"valueList": [],
								"attachmentType": null,
								"attachmentSize": null,
								"attachmentName": null,
								"attachmentId": null,
								"dataTypeKey": 0,
								"dropDownType": null,
								"url": null,
								"taskId": null,
								"origin": "Process",
								"attributePath": null,
								"dependantOn": null,
								"rowNumber": 0,
								"tableAttributes": null,
								"tableContents": null,
								"isDeleted": false,
								"isRunTime": false,
								"isVisible": null
							}, {
								"processName": "MDGGLWorkflow",
								"key": "0i85b845jf0djd",
								"label": "CountryCodeAccountGroup",
								"processType": null,
								"isEditable": true,
								"isActive": true,
								"isMandatory": true,
								"isEdited": 2,
								"attrDes": "CountryCodeAccountGroup",
								"value": "US+" + oGLData.Ska1.ktoks,
								"dataType": "INPUT",
								"valueList": [],
								"attachmentType": null,
								"attachmentSize": null,
								"attachmentName": null,
								"attachmentId": null,
								"dataTypeKey": 0,
								"dropDownType": null,
								"url": null,
								"taskId": null,
								"origin": "Process",
								"attributePath": null,
								"dependantOn": null,
								"rowNumber": 0,
								"tableAttributes": null,
								"tableContents": null,
								"isDeleted": false,
								"isRunTime": false,
								"isVisible": null
							}, {
								"processName": "MDGGLWorkflow",
								"key": "44i9g25013eg8",
								"label": "CR Number",
								"processType": null,
								"isEditable": true,
								"isActive": true,
								"isMandatory": true,
								"isEdited": 2,
								"attrDes": "CR Number",
								"value": oGLData.Ska1.entity_id,
								"dataType": "INPUT",
								"valueList": [],
								"attachmentType": null,
								"attachmentSize": null,
								"attachmentName": null,
								"attachmentId": null,
								"dataTypeKey": 0,
								"dropDownType": null,
								"url": null,
								"taskId": null,
								"origin": "Process",
								"attributePath": null,
								"dependantOn": null,
								"rowNumber": 0,
								"tableAttributes": null,
								"tableContents": null,
								"isDeleted": false,
								"isRunTime": false,
								"isVisible": null
							}],
							"userId": this.getView().getModel("userManagementModel").getProperty("/data/user_id")
						}],
						"type": "Multiple Instance",
						"resourceid": null,
						"actionType": "Submit",
						"processName": "MDGGLWorkflow",
						"processId": null,
						"isEdited": 2,
						"requestId": null,
						"responseMessage": null,
						"userId": this.getView().getModel("userManagementModel").getProperty("/data/user_id"),
						"emailId": this.getView().getModel("userManagementModel").getProperty("/data/email_id"),
						"userName": this.getView().getModel("userManagementModel").getProperty("/data/display_name")
					},
					"changeRequestDTO": {
						"entity_id": oGLData.Ska1.entity_id,
						"change_request_by": {
							"user_id": this.getView().getModel("userManagementModel").getProperty("/data/user_id")
						},
						"modified_by": {
							"user_id": this.getView().getModel("userManagementModel").getProperty("/data/user_id")
						},
						"entity_type_id": "41003",
						"change_request_type_id": oGLData.ChangeRequest.change_request_id,
						"change_request_priority_id": oGLData.ChangeRequest.priority,
						"change_request_due_date": oGLData.ChangeRequest.dueDate,
						"change_request_desc": oGLData.ChangeRequest.desc,
						"change_request_reason_id": oGLData.ChangeRequest.reason
					}
				};
			var objParamCreate = {
				url: "/mdmccpc/workflow-service/workflows/tasks/task/create",
				hasPayload: true,
				data: oData,
				type: "POST"
			};
			this.getView().setBusy(true);
			this.serviceCall.handleServiceRequest(objParamCreate).then(function (oDataResp) {
				this.getView().setBusy(false);
				if (oDataResp.result && oDataResp.result.changeRequestDTO) {
					MessageToast.show("Change Request ID - " + oDataResp.result.changeRequestDTO.change_request_id + " Generated.");
					this._EntityIDDraftFalse();
				}
			}.bind(this), function (oError) {
				this.getView().setBusy(false);
				MessageToast.show("Error In Creating Workflow Task");
			}.bind(this));
		},

		_EntityIDDraftFalse: function () {
			var objParamSubmit = {
				url: "/mdmccpc/entity-service/entities/entity/create",
				type: "POST",
				hasPayload: true,
				data: {
					"entityType": "GL",
					"parentDTO": {
						"customData": {
							"business_entity": {
								"entity_id": this.getModel("GL").getProperty("/Ska1/entityId"),
								"is_draft": "false"
							}
						}
					}
				}
			};
			this.getView().setBusy(true);
			this.serviceCall.handleServiceRequest(objParamSubmit).then(
				oData => {
					this.getView().setBusy(false);
					this.onBackToGLChangeReq();
				},
				oError => {
					this.getView().setBusy(false);
					MessageToast.show("Error while updating draft falg.");
				});
		},

		onBackToGLChangeReq: function () {
			//if (!this.getOwnerComponent().getModel("ChangeRequestsModel").getProperty("/ChangeRequests").length) {
			this.nPageNo = 1;
			this.getAllGLChangeRequests(this.nPageNo);
			this.getGlCrStatistics();
			//}
			this.clearAllButtons();
			this.getView().getParent().getParent().getSideContent().setSelectedItem(this.getView().getParent().getParent().getSideContent().getItem()
				.getItems()[2]);

			this.getModel("App").setProperty("/appTitle", "G/L Change Requests");
			this.getRouter().getTargets().display("GlChangeRequests");
		},

		onApproveClick: function () {
			var sWorkFlowID = this.getView().getModel("GL").getProperty("/workflowID");
			this._claimTask(sWorkFlowID, "Approve", "");
		},

		onRejectClick: function () {
			if (!this.oRejectDailog) {
				this.oRejectDailog = new Dialog({
					title: "Confirmation",
					width: "40%",
					type: "Message",
					state: "Warning",
					content: [
						new sap.m.VBox({
							items: [
								new Text({
									text: "Please enter reject reason and click 'Ok' to reject:"
								}),
								new TextArea({
									id: "idRejectReason",
									width: "100%"
								})
							]
						})
					],
					beginButton: new Button({
						text: "Ok",
						press: function () {
							var sRejectReason = sap.ui.getCore().byId("idRejectReason").getValue();
							if (sRejectReason) {
								var sWorkFlowID = this.getView().getModel("GL").getProperty("/workflowID");
								this._claimTask(sWorkFlowID, "Reject", sRejectReason);
								this.oRejectDailog.close();
							} else {
								MessageToast.show("Please provide reject reason to continoue");
							}
						}.bind(this)
					}),
					endButton: new Button({
						text: "Cancel",
						press: function () {
							this.oRejectDailog.close();
						}.bind(this)
					}),
					afterClose: function () {
						sap.ui.getCore().byId("idRejectReason").setValue("");
					}
				});
			}

			this.getView().addDependent(this.oRejectDailog);
			this.oRejectDailog.open();
		},

		_claimTask: function (sTaskID, sAction, sReason) {
			this.getView().setBusy(true);
			var oData = {
				"workboxTaskActionRequestDTO": {
					"isChatBot": true,
					"userId": this.getView().getModel("userManagementModel").getProperty("/data/user_id"),
					"userDisplay": this.getView().getModel("userManagementModel").getProperty("/data/firstname"),
					"task": [{
						"instanceId": sTaskID,
						"origin": "Ad-hoc",
						"actionType": "Claim",
						"isAdmin": false,
						"platform": "Web",
						"signatureVerified": "NO",
						"userId": this.getView().getModel("userManagementModel").getProperty("/data/user_id")
					}]
				}
			};
			var objParamCreate = {
				url: "/mdmccpc/workflow-service/workflows/tasks/task/claim",
				hasPayload: true,
				data: oData,
				type: "POST"
			};

			this.serviceCall.handleServiceRequest(objParamCreate).then(
				oDataResp => {
					if (oDataResp.result) {
						this._ApproveRejectTask(sTaskID, sAction, sReason);
					}
				},
				oError => {
					this.getView().setBusy(false);
					MessageToast.show("Error In Claiming Workflow Task");
				});
		},

		_ApproveRejectTask: function (sTaskID, sAction, sReason) {
			var sUrl = "";
			var oData = {
				"workboxTaskActionRequestDTO": {
					"isChatBot": true,
					"userId": this.getView().getModel("userManagementModel").getProperty("/data/user_id"),
					"userDisplay": this.getView().getModel("userManagementModel").getProperty("/data/firstname"),
					"task": [{
						"instanceId": sTaskID,
						"origin": "Ad-hoc",
						"actionType": sAction,
						"isAdmin": false,
						"platform": "Web",
						"signatureVerified": "NO",
						"comment": sAction + " task",
						"userId": this.getView().getModel("userManagementModel").getProperty("/data/user_id")
					}]
				}
			};
			if (sAction === "Approve") {
				sUrl = "approve";
				oData.changeRequestDTO = {
					"entity_id": this.getView().getModel("CostCenter").getProperty("/Csks/entity_id")
				};
			} else {
				sUrl = "reject";
			}
			var objParamCreate = {
				url: "/mdmccpc/workflow-service/workflows/tasks/task/" + sUrl,
				hasPayload: true,
				data: oData,
				type: 'POST'
			};

			this.serviceCall.handleServiceRequest(objParamCreate).then(
				oDataResp => {
					if (oDataResp.result) {
						this.onBackToGLChangeReq();
					}

					//Adding rejection reason to comment section
					if (sAction.toLowerCase() === "reject") {
						this.onAddComment({
							sEntityID: this.getView().getModel("GL").getProperty("/Ska1/entityId"),
							comment: sReason,
							sControlID: "previewCRCommentBoxId"
						});
					}

					this.getView().setBusy(false);
					var sMessage = sAction.toLowerCase() === "approve" ? "Approved" : "Rejected";
					MessageToast.show(sMessage);
				},
				oError => {
					this.getView().setBusy(false);
					var aError = [];
					if (oError.responseJSON.result && oError.responseJSON.result.workboxCreateTaskResponseDTO && oError.responseJSON.result.workboxCreateTaskResponseDTO
						.response.EXT_MESSAGES.MESSAGES.item &&
						oError.responseJSON.result.workboxCreateTaskResponseDTO.response.EXT_MESSAGES.MESSAGES.item.length > 0) {
						oError.responseJSON.result.workboxCreateTaskResponseDTO.response.EXT_MESSAGES.MESSAGES.item.forEach(function (oItem) {
							aError.push({
								ErrorMessage: oItem.MESSAGE
							});
						});
					} else if (!oError.responseJSON.result) {
						aError.push({
							ErrorMessage: oError.responseJSON.error
						});
					}
					MessageToast.show("Error In " + sAction + " Workflow Task");
				});
		},
	});
});