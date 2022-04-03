sap.ui.define([
	"murphy/mdm/mdmGLAccount/controller/BaseController"
], function (BaseController) {
	"use strict";

	return BaseController.extend("murphy.mdm.mdmGLAccount.controller.GlCreate", {
		onChangeName: function (oEvent) {
			var sName = oEvent.getSource().getValue(),
				oGLModel = this.getModel("GL"),
				oGL = oGLModel.getData(),
				oSkat = Object.assign({}, this.getModel("App").getProperty("/skat"));

			var oEnSkat = oGL.Skat.find(oItem => {
				return oItem.spras === "E";
			});

			if (oEnSkat) {
				oEnSkat.ktext = sName;
			} else {
				oSkat.entity_id = oGL.Ska1.entity_id;
				oSkat.ktext = sName;
				oSkat.spras = "E";
				oGL.Skat.push(oSkat);
			}
			oGLModel.setData(oGL);
		},

		onAddDescription: function (oEvent) {
			var oGL = this.getModel("GL"),
				oGLData = oGL.getData(),
				oSkat = Object.assign({}, this.getModel("App").getProperty("/skat"));
			oGLData.Skat.push(oSkat);
			oSkat.entity_id = oGLData.Ska1.entity_id;
			oGL.setData(oGLData);
		},

		onDeleteDesc: function (oEvent) {
			var sPath = oEvent.getSource().getBindingContext("GL").getPath(),
				oGLModel = this.getModel("GL"),
				oGLData = oGLModel.getData(),
				iIndex = Number(sPath.replace("/Skat/", ""));
			if (iIndex > -1) {
				oGLData.Skat.splice(iIndex, 1);
				oGLModel.setData(oGLData);
			}
		}
	});

});