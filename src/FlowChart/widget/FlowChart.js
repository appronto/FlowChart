/*global logger*/
/*
    FlowChart
    ========================

    @file      : FlowChart.js
    @version   : 1.0.0
    @author    : JvdGraaf
    @date      : Wed, 15 Nov 2017 07:22:55 GMT
    @copyright : Appronto
    @license   : Apache2

    Documentation
    ========================
    Describe your widget here.
*/

// Required module list. Remove unnecessary modules, you can always get them back from the boilerplate.
define([
    "dojo/_base/declare",
    "mxui/widget/_WidgetBase",
    "dijit/_TemplatedMixin",

    "mxui/dom",
    "dojo/dom",
    "dojo/dom-prop",
    "dojo/dom-geometry",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/dom-construct",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/text",
    "dojo/html",
    "dojo/_base/event",

    "FlowChart/lib/jquery-1.11.2",
    "dojo/text!FlowChart/widget/template/FlowChart.html",
    "FlowChart/lib/mermaidAPI.min"
], function (declare, _WidgetBase, _TemplatedMixin, dom, dojoDom, dojoProp, dojoGeometry, dojoClass, dojoStyle, dojoConstruct, dojoArray, lang, dojoText, dojoHtml, dojoEvent, _jQuery, widgetTemplate, mermaid) {
    "use strict";

    var $ = _jQuery.noConflict(true);

    // Declare widget's prototype.
    return declare("FlowChart.widget.FlowChart", [ _WidgetBase, _TemplatedMixin ], {
        // _TemplatedMixin will create our dom node using this HTML template.
        templateString: widgetTemplate,

        // DOM elements
        mermaidbox: null,

        // Parameters configured in the Modeler.
        ContentAttr: "",

        // Internal variables. Non-primitives created in the prototype are shared between all widget instances.
        _handles: null,
        _contextObj: null,
        _alertDiv: null,
        _readOnly: false,

        // dojo.declare.constructor is called to construct the widget instance. Implement to initialize non-primitive properties.
        constructor: function () {
            logger.debug(this.id + ".constructor");
            this._handles = [];
        },

        // dijit._WidgetBase.postCreate is called after constructing the widget. Implement to do extra setup work.
        postCreate: function () {
            logger.debug(this.id + ".postCreate");

            if (this.readOnly || this.get("disabled") || this.readonly) {
              this._readOnly = true;
            }

            this._updateRendering();
//            this._setupEvents();
        },

        // mxui.widget._WidgetBase.update is called when context is changed or initialized. Implement to re-render and / or fetch data.
        update: function (obj, callback) {
            logger.debug(this.id + ".update");

            this._contextObj = obj;
            this._resetSubscriptions();
            this._updateRendering(callback); // We're passing the callback to updateRendering to be called after DOM-manipulation
        },

        // mxui.widget._WidgetBase.enable is called when the widget should enable editing. Implement to enable editing if widget is input widget.
        enable: function () {
          logger.debug(this.id + ".enable");
        },

        // mxui.widget._WidgetBase.enable is called when the widget should disable editing. Implement to disable editing if widget is input widget.
        disable: function () {
          logger.debug(this.id + ".disable");
        },

        // mxui.widget._WidgetBase.resize is called when the page's layout is recalculated. Implement to do sizing calculations. Prefer using CSS instead.
        resize: function (box) {
          logger.debug(this.id + ".resize");
        },

        // mxui.widget._WidgetBase.uninitialize is called when the widget is destroyed. Implement to do special tear-down work.
        uninitialize: function () {
          logger.debug(this.id + ".uninitialize");
            // Clean up listeners, helper objects, etc. There is no need to remove listeners added with this.connect / this.subscribe / this.own.
        },

        // We want to stop events on a mobile device
        _stopBubblingEventOnMobile: function (e) {
            logger.debug(this.id + "._stopBubblingEventOnMobile");
            if (typeof document.ontouchstart !== "undefined") {
                dojoEvent.stop(e);
            }
        },

        // Attach events to HTML dom elements
//        _setupEvents: function () {
//            logger.debug(this.id + "._setupEvents");
//            this.connect(this.colorSelectNode, "change", function (e) {
//                // Function from mendix object to set an attribute.
//                this._contextObj.set(this.backgroundColor, this.colorSelectNode.value);
//            });
//
//            this.connect(this.infoTextNode, "click", function (e) {
//                // Only on mobile stop event bubbling!
//                this._stopBubblingEventOnMobile(e);
//
//                // If a microflow has been set execute the microflow on a click.
//                if (this.mfToExecute !== "") {
//                    this._execMf(this.mfToExecute, this._contextObj.getGuid());
//                }
//            });
//        },

        _execMf: function (mf, guid, cb) {
            logger.debug(this.id + "._execMf");
            if (mf && guid) {
                mx.ui.action(mf, {
                    params: {
                        applyto: "selection",
                        guids: [guid]
                    },
                    callback: lang.hitch(this, function (objs) {
                        if (cb && typeof cb === "function") {
                            cb(objs);
                        }
                    }),
                    error: function (error) {
                        console.debug(error.description);
                    }
                }, this);
            }
        },

        // Rerender the interface.
        _updateRendering: function (callback) {
            console.log(this.id + "._updateRendering");
            
            if(this._contextObj){
                var config = {
                    startOnLoad:false,
                    theme: 'forest'
    //                flowchart:{
    //                    useMaxWidth:false,
    //                    htmlLabels:true
    //                }
                };
                mermaid.initialize(config);

                var graphDefinition = "graph LR \n A[Christmas] -->|Get money| B(Go shopping) \n B --> C{Let me think} \n C -->|One| D[Laptop] \n C -->|Two| E[iPhone] \n C -->|Three| F[Car]";
                var graph = mermaidAPI.render('flowchartcontent', graphDefinition, lang.hitch(this, function (svgCode, bindFunctions) {
                        this.mermaidbox.innerHTML = svgCode;
                    }));
            }

            this._executeCallback(callback, "_updateRendering");
        },

        // Reset subscriptions.
        _resetSubscriptions: function () {
            logger.debug(this.id + "._resetSubscriptions");
            // Release handles on previous object, if any.
            this.unsubscribeAll();

            // When a mendix object exists create subscribtions.
            if (this._contextObj) {
                this.subscribe({
                    guid: this._contextObj.getGuid(),
                    callback: lang.hitch(this, function (guid) {
                        this._updateRendering();
                    })
                });

                this.subscribe({
                    guid: this._contextObj.getGuid(),
                    attr: this.ContentAttr,
                    callback: lang.hitch(this, function (guid, attr, attrValue) {
                        this._updateRendering();
                    })
                });
            }
        },

        _executeCallback: function (cb, from) {
            logger.debug(this.id + "._executeCallback" + (from ? " from " + from : ""));
            if (cb && typeof cb === "function") {
                cb();
            }
        }
    });
});

require(["FlowChart/widget/FlowChart"]);
