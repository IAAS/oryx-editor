/** * Copyright (c) 2006 * Martin Czuchra, Nicolas Peters, Daniel Polak, Willi Tscheschner * * Permission is hereby granted, free of charge, to any person obtaining a * copy of this software and associated documentation files (the "Software"), * to deal in the Software without restriction, including without limitation * the rights to use, copy, modify, merge, publish, distribute, sublicense, * and/or sell copies of the Software, and to permit persons to whom the * Software is furnished to do so, subject to the following conditions: * * The above copyright notice and this permission notice shall be included in * all copies or substantial portions of the Software. * * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER * DEALINGS IN THE SOFTWARE. **/if (!ORYX.Plugins)     ORYX.Plugins = new Object();ORYX.Plugins.Edit = Clazz.extend({    facade: undefined,        construct: function(facade){            this.facade = facade;        this.copyElements = [];                this.facade.registerOnEvent('keydown', this.keyHandler.bind(this));                this.facade.offer({         name: ORYX.I18N.Edit.cut,         description: ORYX.I18N.Edit.cutDesc,         icon: ORYX.PATH + "images/cut.png",         functionality: this.editCut.bind(this),         group: ORYX.I18N.Edit.group,         index: 1,         minShape: 1         });                 this.facade.offer({         name: ORYX.I18N.Edit.copy,         description: ORYX.I18N.Edit.copyDesc,         icon: ORYX.PATH + "images/page_copy.png",         functionality: this.editCopy.bind(this),         group: ORYX.I18N.Edit.group,         index: 2,         minShape: 1         });                 this.facade.offer({         name: ORYX.I18N.Edit.paste,         description: ORYX.I18N.Edit.pasteDesc,         icon: ORYX.PATH + "images/page_paste.png",         functionality: this.editPaste.bind(this),         isEnabled: this.clipboardIsOccupied.bind(this),         group: ORYX.I18N.Edit.group,         index: 3,         minShape: 0,         maxShape: 0         });                 this.facade.offer({            name: ORYX.I18N.Edit.del,            description: ORYX.I18N.Edit.delDesc,            icon: ORYX.PATH + "images/cross.png",            functionality: this.editDelete.bind(this),            group: ORYX.I18N.Edit.group,            index: 4,            minShape: 1        });                         /* What is the purpose of this?!		 this.facade.offer({         name: "Show Clipboard",         description: "Show Clipboard.",         icon: ORYX.PATH + "images/box.png",         functionality: this.showClipboard.bind(this),         group: "Edit",         index: 5         });         */             },        /**     * Determines whether the clipboard currently is occupied.     */    clipboardIsOccupied: function(){        return this.copyElements.length > 0;    },        showClipboard: function(){            Ext.Msg.alert("Oryx", this.inspect(this.copyElements, true, 3));    },        inspect: function(toInspect, ignoreFunctions, depth){            if (depth-- <= 0)             return toInspect;                var temp = "";        for (key in toInspect) {                    var current = toInspect[key];                        if (ignoreFunctions && (current instanceof Function))                 continue;                        temp += key + ": (" + this.inspect(current, ignoreFunctions, depth) +            ") -";        }                if (temp == "")             return toInspect;        else             return temp;    },    	move: function(key, far) {		// calculate the distance to move the objects and get the selection.		var distance = far? 20 : 5;		var selection = this.facade.getSelection();		var p = {x: 0, y: 0};				// switch on the key pressed and populate the point to move by.		switch(key) {			case ORYX.CONFIG.KEY_CODE_LEFT:				p.x = -1*distance;				break;			case ORYX.CONFIG.KEY_CODE_RIGHT:				p.x = distance;				break;			case ORYX.CONFIG.KEY_CODE_UP:				p.y = -1*distance;				break;			case ORYX.CONFIG.KEY_CODE_DOWN:				p.y = distance;				break;		}				// move each shape in the selection by the point calculated and update it.		selection.findAll(function(shape){ 			// Check if this shape is docked to an shape in the selection						if(shape instanceof ORYX.Core.Node && selection.include(shape.getIncomingShapes()[0])){ 				//return false 			} 						// Check if any of the parent shape is included in the selection			var s = shape.parent; 			do{ 				if(selection.include(s)){ 					return false				}			}while(s = s.parent); 						// Otherwise, return true			return true;					}).each(function(shape) {									if (shape instanceof ORYX.Core.Edge) {				shape.dockers.each(function(docker){					if( !selection.member(docker.getDockedShape()) ){						docker.setDockedShape(undefined);						docker.bounds.moveBy(p);						docker.update();							}										})			} else {								shape.bounds.moveBy(p);				shape.update();									var childShapesNodes 	= shape.getChildShapes(true).findAll(function(shape){ return shape instanceof ORYX.Core.Node });				var childDockedShapes 	= childShapesNodes.collect(function(shape){ return shape.getAllDockedShapes() }).flatten().uniq();				var childDockedEdge		= childDockedShapes.findAll(function(shape){ return shape instanceof ORYX.Core.Edge  && !selection.include(shape)});				childDockedEdge			= childDockedEdge.findAll(function(shape){ return shape.getAllDockedShapes().all(function(dsh){ return childShapesNodes.include(dsh)}) });				var childDockedDockers	= childDockedEdge.collect(function(shape){ return shape.dockers }).flatten();								childDockedDockers.each(function(docker){					if( !docker.getDockedShape() && !selection.include(docker.parent)){						docker.bounds.moveBy(p);						docker.update();					}				}.bind(this));								}		});				// when done, the selection needs to be updated, too.		this.facade.updateSelection();				ORYX.Log.debug("Leaving move in edit.js.");	},	    /**     * The key handler for this plugin. Every action from the set of cut, copy,     * paste and delete should be accessible trough simple keyboard shortcuts.     * This method checks whether any event triggers one of those actions.     *     * @param {Object} event The keyboard event that should be analysed for     *     triggering of this plugin.     */    keyHandler: function(event){        //TODO document what event.which is.                ORYX.Log.debug("edit.js handles a keyEvent.");                // assure we have the current event.        if (!event)             event = window.event;                        // get the currently pressed key and state of control key.        var pressedKey = event.which || event.keyCode;        var ctrlPressed = event.ctrlKey;		// if the key is one of the arrow keys, forward to move and return.		if ([ORYX.CONFIG.KEY_CODE_LEFT, ORYX.CONFIG.KEY_CODE_RIGHT,			ORYX.CONFIG.KEY_CODE_UP, ORYX.CONFIG.KEY_CODE_DOWN].include(pressedKey)) {						this.move(pressedKey, !ctrlPressed);			return;		}                // if the object is to be deleted, do so, and return immediately.        if ((pressedKey == ORYX.CONFIG.KEY_CODE_DELETE) ||        ((pressedKey == ORYX.CONFIG.KEY_CODE_BACKSPACE) &&        (event.metaKey || event.appleMetaKey))) {                    ORYX.Log.debug("edit.js deletes the shape.");            this.editDelete();            return;        }                 // if control key is not pressed, we're not interested anymore.         if (!ctrlPressed)         return;                  // when ctrl is pressed, switch trough the possibilities.         switch (pressedKey) {         	         // cut.	         case ORYX.CONFIG.KEY_CODE_X:	         this.editCut();	         break;	         	         // copy.	         case ORYX.CONFIG.KEY_CODE_C:	         this.editCopy();	         break;	         	         // paste.	         case ORYX.CONFIG.KEY_CODE_V:	         this.editPaste();	         break;         }    },		getShapesAsJSON: function(shapes) {		var result = [];				var shapeAsJSON;				shapes.each(function(shape) {			shapeAsJSON = {id: shape.resourceId, 						   type: shape.getStencil().id(),						   serialize: shape.serialize()};						   			result.push(shapeAsJSON);						/*shape.getChildNodes(true).each(function(child) {				shapeAsJSON = {id: child.resourceId, 							   type: child.getStencil().id(),							   serialize: child.serialize()};							   				result.push(shapeAsJSON);			});*/		});				result.each(function(shape) {			shape.serialize = shape.serialize.findAll(function(ser) {				if(ser.prefix == "raziel" && ser.name == "outgoing" ||				   ser.prefix == "raziel" && ser.name == "target") {					return result.any(function(shape2) {						return '#' + shape2.id == ser.value;					});				} else {					return true;				}			})		});				return result;	},		getAllShapesToConsider: function(shapes) {		var resultShapes;		var connections = [];		var parents = new Hash();				var tempShapes = shapes.clone();				//get all children		shapes.each(function(shape) {			shape.getChildNodes(true).each(function(child) {				if(!tempShapes.member(child))					tempShapes.push(child);			}.bind(this));		});				resultShapes = tempShapes.clone();				//get all connected shapes		var i = 0;		while(i < resultShapes.length) {			var shape = resultShapes[i++];			this._storeConnection(shape, connections);			var source = (shape.getDockers().first()) ? shape.getDockers().first().getDockedShape() : undefined;			var target = (shape.getDockers().last()) ? shape.getDockers().last().getDockedShape() : undefined;						//get outgoing shapes			shape.getOutgoingShapes().each(function(os) {				if (!resultShapes.member(os)) {					if(os != target &&						!(shape instanceof ORYX.Core.Edge &&						os instanceof ORYX.Core.Node))						resultShapes.push(os);					this._storeConnection(os, connections);				}				}.bind(this));						//get incoming shapes			shape.getIncomingShapes().each(function(is) {				if (!resultShapes.member(is)) {					if(is != source &&						!(shape instanceof ORYX.Core.Edge &&						os instanceof ORYX.Core.Node)) 						resultShapes.push(is);					this._storeConnection(is, connections);				}			}.bind(this));		}				//remove all shapes that are connected to a node that is		// not in the array		var curLength;		do {			curLength = resultShapes.length;			var wrongEdges = [];			resultShapes.each(function(shape) {				if(shape instanceof ORYX.Core.Edge &&				   !shapes.member(shape) &&				   (shape.getDockers().first().getDockedShape() != undefined &&				    !resultShapes.member(shape.getDockers().first().getDockedShape()) ||					shape.getDockers().last().getDockedShape() != undefined &&				    !resultShapes.member(shape.getDockers().last().getDockedShape()))) {										wrongEdges.push(shape);				}			}.bind(this));						while(wrongEdges.length > 0) {				resultShapes = resultShapes.without(wrongEdges.pop());			}		} while(resultShapes.length != curLength);				resultShapes.each((function(shape){										//store parent for each shape			if(shape.parent)				parents[shape.id] = shape.parent;        }).bind(this));						return {			shapes: resultShapes,			connections: connections,			parents: parents		};	},		_storeConnection: function(shape, connections) {		if (shape.getDockers().first()) {			connections.push([shape.getDockers().first(), 									shape.getDockers().first().getDockedShape(), 									shape.getDockers().first().referencePoint]);			if (shape instanceof ORYX.Core.Edge) 				connections.push([shape.getDockers().last(), 										shape.getDockers().last().getDockedShape(), 										shape.getDockers().last().referencePoint]);		}	},        /**     * Performs the cut operation by first copy-ing and then deleting the     * current selection.     */    editCut: function(){        //TODO document why this returns false.        //TODO document what the magic boolean parameters are supposed to do.                this.editCopy(false);        this.editDelete(true);        return false;    },        /**     * Performs the copy operation.     * @param {Object} will_not_update ??     */    editCopy: function( will_update ){        		var selection = this.facade.getSelection();				//if the selection is empty, do not remove the previously copied elements		if(selection.lenght == 0)			return;				//not only the selected shapes have to be considered, but also		// all child shapes and the connections between them		var shapeInfos = this.getAllShapesToConsider(selection);				//the method above also returns not selected edges that connect 		// two selected shapes. those edges have to be removed here		selection.each(function(shape) {			shape.getAllDockedShapes().each(function(os) {				if(os instanceof ORYX.Core.Edge &&				   !selection.member(os)) {					shapeInfos.shapes = shapeInfos.shapes.without(os);				}			}.bind(this));		}.bind(this));				//store the shapes to copy in JSON format		this.copyElements = this.getShapesAsJSON(shapeInfos.shapes);				                if( will_update ){            this.facade.updateSelection();					}    },        /**     * Performs the paste operation.     */    editPaste: function(){ 				//move all elements that have a parent that is not		// in the list of the elements to copy		// except edges		this.copyElements.each(function(element) {			element.serialize.any(function(ser){				if (ser.name == "parent" && ser.prefix == "raziel") {					var member = this.copyElements.any(function(element2){						return "#" + element2.id == ser.value;					});										if (!member) {						//move						//only move those elements that reference a parent that is not copied						element.serialize.each(function(ser2){							if (ser2.name == "bounds" && ser2.prefix == "oryx") {								var result = "";								ser2.value.split(",").without("").each(function(value){																		try {										value = parseFloat(value);										value += ORYX.CONFIG.COPY_MOVE_OFFSET;										result += value + ",";									} 									catch (e) {										result += value + ",";									}								}.bind(this));								result = result.substring(0, result.length - 1);																ser2.value = result;							}						}.bind(this));					}										return true;				} else {					return false;				}			}.bind(this));		}.bind(this));				//renew resourceIds, but keep references		//move elements		this.copyElements.each(function(element) {			var id = element.id;						//TODO not in facade			element.id = ORYX.Editor.provideId();						this.copyElements.each(function(otherElement) {				otherElement.serialize.each(function(ser) {					if(ser.value == "#" + id)						ser.value = "#" + element.id;				});			});											}.bind(this));				this.facade.importJSON(this.copyElements);		    },        /**     * Performs the delete operation. No more asking.     */    editDelete: function(){            var elements = this.facade.getSelection();				var shapeInfos = this.getAllShapesToConsider(elements);        		var commandClass = ORYX.Core.Command.extend({			construct: function(selectedShapes, shapes, connections, parents, facade){				this.selectedShapes		= selectedShapes;				this.facade				= facade;				this.connections		= connections;				this.shapes				= shapes;				this.parents			= parents;							},						execute: function(){				this.shapes.each(function(shape){					this.facade.deleteShape(shape);		        }.bind(this));						this.parents.values().uniq().each(function(parent) {					parent.update();				});								this.facade.setSelection([]);			},			rollback: function(){								this.shapes.each(function(shape) {					this.parents[shape.id].add(shape);				}.bind(this));								//reconnect shapes				this.connections.each(function(con) {					con[0].setDockedShape(con[1]);					con[0].setReferencePoint(con[2]);					con[0].update();				}.bind(this));								this.parents.values().uniq().each(function(parent) {					if(!this.shapes.member(parent))						parent.update();				}.bind(this));								this.facade.setSelection(this.selectedShapes);			}		});				var command = new commandClass(elements, 									   shapeInfos.shapes, 									   shapeInfos.connections, 									   shapeInfos.parents, 									   this.facade);				this.facade.executeCommands([command]);    }});