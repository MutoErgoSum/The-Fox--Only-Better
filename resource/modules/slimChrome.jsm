moduleAid.VERSION = '1.3.1';

this.__defineGetter__('slimChromeSlimmer', function() { return $(objName+'-slimChrome-slimmer'); });
this.__defineGetter__('slimChromeContainer', function() { return $(objName+'-slimChrome-container'); });
this.__defineGetter__('slimChromeToolbars', function() { return $(objName+'-slimChrome-toolbars'); });

this.__defineGetter__('browserPanel', function() { return $('browser-panel'); });
this.__defineGetter__('customToolbars', function() { return $('customToolbars'); });
this.getComputedStyle = function(el) { return window.getComputedStyle(el); };

// until I find a better way of finding out on which side of the browser is the scrollbar, I'm setting equal margins
this.MIN_LEFT = 22;
this.MIN_RIGHT = 22;
this.MIN_WIDTH = 550;

this.moveSlimChromeStyle = {};
this.lastSlimChromeStyle = null;

this.delayMoveSlimChrome = function() {
	timerAid.init('delayMoveSlimChrome', moveSlimChrome, 0);
};

this.shouldReMoveSlimChrome = function(newStyle) {
	if(!lastSlimChromeStyle) { return true; }
	
	if(!newStyle) {
		return (slimChromeContainer.clientWidth != lastSlimChromeStyle.clientWidth);
	}
	else if(newStyle.right != lastSlimChromeStyle.right
		|| newStyle.left != lastSlimChromeStyle.left
		|| newStyle.width != lastSlimChromeStyle.width
		|| newStyle.clientWidth != lastSlimChromeStyle.clientWidth) {
			return true;
	}
	
	return false;
};

// Handles the position of the top chrome
this.moveSlimChrome = function() {
	moveSlimChromeStyle = {
		width: -MIN_RIGHT -MIN_LEFT,
		clientWidth: slimChromeContainer.clientWidth,
		left: MIN_LEFT,
		right: MIN_RIGHT
	};
	
	var appContentPos = $('content').getBoundingClientRect();
	moveSlimChromeStyle.width += appContentPos.width;
	moveSlimChromeStyle.left += appContentPos.left;
	moveSlimChromeStyle.right += document.documentElement.clientWidth -appContentPos.right;
	
	// Compatibility with TreeStyleTab
	if($('TabsToolbar') && !$('TabsToolbar').collapsed) {
		// This is also needed when the tabs are on the left, the width of the findbar doesn't follow with the rest of the window for some reason
		if($('TabsToolbar').getAttribute('treestyletab-tabbar-position') == 'left' || $('TabsToolbar').getAttribute('treestyletab-tabbar-position') == 'right') {
			var TabsToolbar = $('TabsToolbar');
			var TabsSplitter = document.getAnonymousElementByAttribute($('content'), 'class', 'treestyletab-splitter');
			moveSlimChromeStyle.width -= TabsToolbar.clientWidth;
			moveSlimChromeStyle.width -= TabsSplitter.clientWidth +(TabsSplitter.clientLeft *2);
			if(TabsToolbar.getAttribute('treestyletab-tabbar-position') == 'left') {
				moveSlimChromeStyle.left += TabsToolbar.clientWidth;
				moveSlimChromeStyle.left += TabsSplitter.clientWidth +(TabsSplitter.clientLeft *2);
			}
			if(TabsToolbar.getAttribute('treestyletab-tabbar-position') == 'right') {
				moveSlimChromeStyle.right += TabsToolbar.clientWidth;
				moveSlimChromeStyle.right += TabsSplitter.clientWidth +(TabsSplitter.clientLeft *2);
			}
		}
	}
	
	moveSlimChromeStyle.width = Math.max(moveSlimChromeStyle.width, 100);
	
	if(!shouldReMoveSlimChrome(moveSlimChromeStyle)) { return; }
	
	lastSlimChromeStyle = moveSlimChromeStyle;
	
	// Unload current stylesheet if it's been loaded
	styleAid.unload('slimChromeMove_'+_UUID);
	
	var sscode = '/*The Fox, Only Better CSS declarations of variable values*/\n';
	sscode += '@namespace url(http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul);\n';
	sscode += '@-moz-document url("'+document.baseURI+'") {\n';
	sscode += '	window['+objName+'_UUID="'+_UUID+'"] #theFoxOnlyBetter-slimChrome-container {\n';
	sscode += '		left: ' + moveSlimChromeStyle.left + 'px;\n';
	sscode += '	}\n';
	sscode += '	window['+objName+'_UUID="'+_UUID+'"] #theFoxOnlyBetter-slimChrome-container[hover] {\n';
	sscode += '		width: ' + moveSlimChromeStyle.width + 'px;\n';
	sscode += '	}\n';
	sscode += '	window['+objName+'_UUID="'+_UUID+'"] #theFoxOnlyBetter-slimChrome-container:not([hover]) {\n';
	sscode += '		width: ' + Math.min(moveSlimChromeStyle.width, MIN_WIDTH) + 'px;\n';
	sscode += '	}\n';
	sscode += '}';
	
	styleAid.load('slimChromeMove_'+_UUID, sscode, true);
	
	findPersonaPosition();
};

this.onMouseOver = function(e) {
	setHover(true, e && isAncestor(e.target, slimChromeContainer));
};

this.onMouseOut = function() {
	setHover(false);
};

this.onFocus = function() {
	setHover(true, true);
};

this.onMouseOutBrowser = function(e) {
	// bascially this means that when the mouse left something, it entered "nothing", which is what we want to capture here
	if(e.relatedTarget) { return; }
	
	// we also only need to show if the mouse is hovering the toolbox, leaving the window doesn't count
	if(e.screenY < gNavToolbox.boxObject.screenY
	|| e.screenY > (gNavToolbox.boxObject.screenY +gNavToolbox.boxObject.height)
	|| e.screenX < gNavToolbox.boxObject.screenX
	|| e.screenY > (gNavToolbox.boxObject.screenX +gNavToolbox.boxObject.width)) { return; }
	
	onMouseOver();
	
	// don't keep listening to mouseout, otherwise the toolbox would get stuck open
	listenerAid.remove(browserPanel, 'mouseout', onMouseOutBrowser);
	listenerAid.add(browserPanel, 'mouseover', onMouseReEnterBrowser);
};

this.onMouseReEnterBrowser = function(e) {
	// no need to check for target here, if we're entering something, there's always "something" to enter, so the other handlers can take care of it
	onMouseOut();
	
	// stop this listener, or the toolbox would be stuck close otherwise, and start listening for mouseout again
	listenerAid.remove(browserPanel, 'mouseover', onMouseReEnterBrowser);
	listenerAid.add(browserPanel, 'mouseout', onMouseOutBrowser);
};

this.onMouseOverToolbox = function(e) {
	if(trueAttribute(slimChromeContainer, 'mini') && !trueAttribute(slimChromeContainer, 'hover') && isAncestor(e.target, slimChromeContainer)) {
		slimChromeContainer.hoversQueued++;
		return;
	}
	onMouseOver(e);
};

this.onMouseOutToolbox = function(e) {
	if(trueAttribute(slimChromeContainer, 'mini') && !trueAttribute(slimChromeContainer, 'hover') && isAncestor(e.target, slimChromeContainer)) {
		slimChromeContainer.hoversQueued--;
		return;
	}
	onMouseOut();
};

this.onDragEnter = function() {
	setHover(true, false, 1);
	listenerAid.remove(slimChromeContainer, 'dragenter', onDragEnter);
	listenerAid.add(gBrowser, "dragenter", onDragExitAll);
	listenerAid.add(window, "drop", onDragExitAll);
	listenerAid.add(window, "dragend", onDragExitAll);
};

this.onDragExit = function() {
	setHover(false);
};

this.onDragExitAll = function() {
	listenerAid.add(gNavToolbox, 'dragenter', onDragEnter);
	listenerAid.remove(gBrowser, "dragenter", onDragExitAll);
	listenerAid.remove(window, "drop", onDragExitAll);
	listenerAid.remove(window, "dragend", onDragExitAll);
	setHover(false);
};

this.setHover = function(hover, now, force) {
	if(hover) {
		slimChromeContainer.hovers++;
		
		if(!now) {
			timerAid.init('setHover', function() {
				setAttribute(slimChromeContainer, 'hover', 'true');
			}, 75);
		} else {
			timerAid.cancel('setHover');
			setAttribute(slimChromeContainer, 'hover', 'true');
			
			// in case the width doesn't change, we need to make sure transitioning from mini mode to full mode doesn't hide the chrome when mousing out
			if(lastSlimChromeStyle.width <= MIN_WIDTH && !trueAttribute(slimChromeContainer, 'fullWidth')) {
				slimChromeFinishedWidth();
			}
		}
		
		if(force !== undefined && typeof(force) == 'number') {
			slimChromeContainer.hovers = force;
		}
	}
	else {
		if(force !== undefined && typeof(force) == 'number') {
			slimChromeContainer.hovers = force;
		} else if(slimChromeContainer.hovers > 0) {
			slimChromeContainer.hovers--;
		}
		
		if(slimChromeContainer.hovers == 0) {
			removeAttribute(slimChromeContainer, 'fullWidth');
			
			if(!now) {
				timerAid.init('setHover', function() {
					removeAttribute(slimChromeContainer, 'hover');
				}, 250);
			} else {
				timerAid.cancel('setHover');
				removeAttribute(slimChromeContainer, 'hover');
			}
		}
	}
};

this.setMini = function(mini) {
	dispatch(slimChromeContainer, { type: 'willSetMiniChrome', cancelable: false, detail: mini });
	
	if(mini) {
		timerAid.cancel('onlyURLBar');
		timerAid.cancel('setMini');
		setAttribute(slimChromeContainer, 'mini', 'true');
		setAttribute(slimChromeContainer, 'onlyURLBar', 'true');
	} else {
		// aSync so the toolbox focus handler knows what it's doing
		timerAid.init('setMini', function() {
			removeAttribute(slimChromeContainer, 'mini');
			timerAid.init('onlyURLBar', function() {
				removeAttribute(slimChromeContainer, 'onlyURLBar');
			}, 300);
		}, 50);
	}
};

this.focusPasswords = function(e) {
	if(e.target
	&& e.target.nodeName
	&& e.target.nodeName.toLowerCase() == 'input'
	&& !e.target.disabled
	&& (prefAid.miniOnAllInput || e.target.type == 'password')) {
		setMini(e.type == 'focus');
	}
};

this.findPersonaPosition = function() {
	if(!trueAttribute(document.documentElement, 'lwtheme')) {
		prefAid.lwthemebgImage = '';
		prefAid.lwthemebgWidth = 0;
		prefAid.lwthemecolor = '';
		prefAid.lwthemebgColor = '';
		stylePersonaSlimChrome();
		return;
	}
	
	var windowStyle = getComputedStyle(document.documentElement);
	if(prefAid.lwthemebgImage != windowStyle.getPropertyValue('background-image') && windowStyle.getPropertyValue('background-image') != 'none') {
		prefAid.lwthemebgImage = windowStyle.getPropertyValue('background-image');
		prefAid.lwthemecolor = windowStyle.getPropertyValue('color');
		prefAid.lwthemebgColor = windowStyle.getPropertyValue('background-color');
		prefAid.lwthemebgWidth = 0;
		
		lwthemeImage = new window.Image();
		lwthemeImage.onload = function() { findPersonaWidth(); };
		lwthemeImage.src = prefAid.lwthemebgImage.substr(5, prefAid.lwthemebgImage.length - 8);
		return;
	}
	
	stylePersonaSlimChrome();
};

this.findPersonaWidth = function() {
	if(prefAid.lwthemebgWidth == 0 && lwthemeImage.naturalWidth != 0) {
		prefAid.lwthemebgWidth = lwthemeImage.naturalWidth;
	}
	
	if(prefAid.lwthemebgWidth != 0) {
		stylePersonaSlimChrome();
	}
};

this.stylePersonaSlimChrome = function() {
	// Unload current stylesheet if it's been loaded
	styleAid.unload('personaSlimChrome_'+_UUID);
	
	if(prefAid.lwthemebgImage != '') {
		var windowStyle = getComputedStyle(document.documentElement);
		var containerBox = slimChromeContainer.getBoundingClientRect();
		var containerStyle = getComputedStyle(slimChromeContainer);
		
		// Another personas in OSX tweak
		var offsetWindowPadding = windowStyle.getPropertyValue('background-position');
		var offsetPersonaY = -containerBox.top;
		offsetPersonaY += parseInt(containerStyle.getPropertyValue('margin-top'));
		if(offsetWindowPadding.indexOf(' ') > -1 && offsetWindowPadding.indexOf('px', offsetWindowPadding.indexOf(' ') +1) > -1) {
			var offset = parseInt(offsetWindowPadding.substr(offsetWindowPadding.indexOf(' ') +1, offsetWindowPadding.indexOf('px', offsetWindowPadding.indexOf(' ') +1)));
			offsetPersonaY += offset;
		}
		
		if(containerStyle.getPropertyValue('direction') == 'ltr') {
			var borderStart = parseInt(containerStyle.getPropertyValue('border-left-width'));
		} else {
			var borderStart = parseInt(containerStyle.getPropertyValue('border-right-width'));
		}
		
		var offsetPersonaX = -lastSlimChromeStyle.left -(prefAid.lwthemebgWidth - document.documentElement.clientWidth) -borderStart;
		
		var sscode = '/*The Fox, only better CSS declarations of variable values*/\n';
		sscode += '@namespace url(http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul);\n';
		sscode += '@-moz-document url("'+document.baseURI+'") {\n';
		sscode += '	window['+objName+'_UUID="'+_UUID+'"] #theFoxOnlyBetter-slimChrome-container {\n';
		sscode += '	  background-image: ' + prefAid.lwthemebgImage + ' !important;\n';
		sscode += '	  background-color: ' + prefAid.lwthemebgColor + ' !important;\n';
		sscode += '	  color: ' + prefAid.lwthemecolor + ' !important;\n';
		sscode += '	  background-position: left '+offsetPersonaX+'px top '+offsetPersonaY+'px !important;\n';
		sscode += '	  background-repeat: repeat !important;\n';
		sscode += '	  background-size: auto auto !important;\n';
		sscode += '	}\n';
		sscode += '}';
		
		styleAid.load('personaSlimChrome_'+_UUID, sscode, true);
	}
};

this.slimChromeTransitioned = function(e) {
	if(e.target != slimChromeContainer) { return; }
	
	switch(e.propertyName) {
		case 'width':
			slimChromeFinishedWidth();
			break;
		
		case 'opacity':
			toggleAttribute(slimChromeContainer, 'noPointerEvents', !trueAttribute(slimChromeContainer, 'mini') && !trueAttribute(slimChromeContainer, 'hover'));
			break;
		
		default: break;
	}
};

this.slimChromeFinishedWidth = function() {
	if(gNavBar.overflowable && slimChromeContainer.hovers > 0) {
		// make sure it doesn't get stuck open
		setHover(true, false, 1);
		
		// account for queued hovers while in mini mode
		if(slimChromeContainer.hoversQueued) {
			slimChromeContainer.hovers += slimChromeContainer.hoversQueued;
			slimChromeContainer.hoversQueued = 0;
		}
		
		setAttribute(slimChromeContainer, 'fullWidth', 'true');
		
		gNavBar.overflowable._onResize();
		gNavBar.overflowable._lazyResizeHandler.finalize().then(function() {
			gNavBar.overflowable._lazyResizeHandler = null;
			dispatch(slimChromeContainer, { type: 'FinishedSlimChromeWidth', cancelable: false });
		});
	}
};

this.slimChromeProgressListener = {
	last: null,
	onLocationChange: function(aProgress, aRequest, aURI) {
		// happens when exiting customize mode, although I have no clue why...
		if(typeof(slimChromeContainer) == 'undefined') { return; }
		
		try { var host = aURI.host; }
		catch(ex) { var host = aURI.spec; }
		
		// no point in showing in certain cases
		if(host == this.last || gBrowser.selectedTab.pinned || window.XULBrowserWindow.inContentWhitelist.indexOf(aURI.spec) > -1) { return; }
		
		this.last = host;
		
		// also no point in showing mini if it's already shown
		if(trueAttribute(slimChromeContainer, 'hover')) {
			setMini(false);
		} else {
			setMini(true);
			timerAid.init('setMini', function() { setMini(false); }, 2000);
		}
	}
};

this.slimChromeKeydown = function(e) {
	if(e.ctrlKey || e.altKey || e.metaKey) { return; }
	onMouseOut();
};

this.initialShowings = [];
this.initialShowChrome = function() {
	setHover(true);
	
	// Taking this from TPP, making the same assumptions.
	// don't use timerAid, because if we use multiple initialShowChrome()'s it could get stuck open
	// we keep a reference to the timer, because otherwise sometimes it would not trigger (go figure...), hopefully this helps with that
	var thisShowing = aSync(function() {
		if(typeof(setHover) != 'undefined') {
			setHover(false);
			for(var i=0; i<initialShowings.length; i++) {
				if(initialShowings[i] == thisShowing) {
					initialShowings.splice(i, 1);
					break;
				}
			}
		}
	}, 3000);
	initialShowings.push(thisShowing);
};

var slimChromeCUIListener = {
	onWidgetAfterDOMChange: function(aNode, aNextNode, aContainer, aWasRemoval) {
		if(isAncestor(aContainer, slimChromeToolbars) && !trueAttribute(slimChromeContainer, 'hover')) {
			var toolbar = aContainer;
			while(toolbar.nodeName != 'toolbar' && toolbar.parentNode) {
				toolbar = toolbar.parentNode;
			}
			if(!toolbar.collapsed) {
				initialShowChrome();
			}
		}
	}
};

this.loadSlimChrome = function() {
	slimChromeContainer.hovers = 0;
	slimChromeContainer.hoversQueued = 0;
	
	slimChromeToolbars.appendChild(gNavBar);
	
	// the nav-bar really shouldn't over- or underflow when it's hidden, as it doesn't have its real width
	gNavBar.overflowable.__onLazyResize = gNavBar.overflowable._onLazyResize;
	gNavBar.overflowable._onLazyResize = function() {
		if(!trueAttribute(slimChromeContainer, 'hover')) { return; }
		this.__onLazyResize();
	};
	gNavBar.overflowable._onOverflow = gNavBar.overflowable.onOverflow;
	gNavBar.overflowable.onOverflow = function(e) {
		if(!trueAttribute(slimChromeContainer, 'hover')) { return; }
		this._onOverflow(e);
	};
	gNavBar.overflowable.__moveItemsBackToTheirOrigin = gNavBar.overflowable._moveItemsBackToTheirOrigin;
	gNavBar.overflowable._moveItemsBackToTheirOrigin = function(shouldMoveAllItems) {
		if(!trueAttribute(slimChromeContainer, 'hover')) { return; }
		this.__moveItemsBackToTheirOrigin(shouldMoveAllItems);
	};
	
	// also append all other custom toolbars
	var toolbar = customToolbars;
	while(toolbar.nextSibling) {
		toolbar = toolbar.nextSibling;
		if(toolbar.id == 'addon-bar') { continue; }
		
		var toMove = toolbar;
		toolbar = toolbar.previousSibling;
		slimChromeToolbars.appendChild(toMove);
		
		if(gNavToolbox.externalToolbars.indexOf(toMove) == -1) {
			gNavToolbox.externalToolbars.push(toMove);
		}
	}
	
	// position the top chrome correctly when the window is resized or a toolbar is shown/hidden
	listenerAid.add(browserPanel, 'resize', delayMoveSlimChrome);
	
	// keep the toolbox when hovering it
	listenerAid.add(gNavToolbox, 'dragenter', onDragEnter);
	listenerAid.add(gNavToolbox, 'mouseover', onMouseOverToolbox);
	listenerAid.add(gNavToolbox, 'mouseout', onMouseOutToolbox);
	
	// the empty area of the tabs toolbar doesn't respond to mouse events, so we need to use mouseout from the browser-panel instead
	listenerAid.add(browserPanel, 'mouseout', onMouseOutBrowser);
	
	// also keep the toolbox visible if it has focus of course
	listenerAid.add(gNavToolbox, 'focus', onFocus, true);
	listenerAid.add(gNavToolbox, 'blur', onMouseOut, true);
	
	// show mini chrome when focusing password fields
	listenerAid.add(gBrowser, 'focus', focusPasswords, true);
	listenerAid.add(gBrowser, 'blur', focusPasswords, true);
	
	// hide chrome when typing in content
	listenerAid.add(gBrowser, 'keydown', slimChromeKeydown, true);
	
	// re-do widgets positions after resizing
	listenerAid.add(slimChromeContainer, 'transitionend', slimChromeTransitioned);
	
	// show mini when the current tab changes host; this will also capture when changing tabs
	gBrowser.addProgressListener(slimChromeProgressListener);
	
	// support personas in hovering toolbox
	observerAid.add(findPersonaPosition, "lightweight-theme-changed");
	
	// follow changes to chrome toolbars, in case they're in our box and it should be shown
	CustomizableUI.addListener(slimChromeCUIListener);
	
	dispatch(slimChromeContainer, { type: 'LoadedSlimChrome', cancelable: false });
	
	moveSlimChrome();
};

this.unloadSlimChrome = function() {
	dispatch(slimChromeContainer, { type: 'UnloadingSlimChrome', cancelable: false });
	
	listenerAid.remove(browserPanel, 'resize', delayMoveSlimChrome);
	listenerAid.remove(browserPanel, 'mouseout', onMouseOutBrowser);
	listenerAid.remove(browserPanel, 'mouseover', onMouseReEnterBrowser);
	listenerAid.remove(gNavToolbox, 'dragenter', onDragEnter);
	listenerAid.remove(gNavToolbox, 'mouseover', onMouseOverToolbox);
	listenerAid.remove(gNavToolbox, 'mouseout', onMouseOutToolbox);
	listenerAid.remove(gBrowser, "dragenter", onDragExitAll);
	listenerAid.remove(window, "drop", onDragExitAll);
	listenerAid.remove(window, "dragend", onDragExitAll);
	listenerAid.remove(gNavToolbox, 'focus', onFocus, true);
	listenerAid.remove(gNavToolbox, 'blur', onMouseOut, true);
	listenerAid.remove(gBrowser, 'focus', focusPasswords, true);
	listenerAid.remove(gBrowser, 'blur', focusPasswords, true);
	listenerAid.remove(gBrowser, 'keydown', slimChromeKeydown, true);
	listenerAid.remove(slimChromeContainer, 'transitionend', slimChromeTransitioned);
	gBrowser.removeProgressListener(slimChromeProgressListener);
	observerAid.remove(findPersonaPosition, "lightweight-theme-changed");
	CustomizableUI.removeListener(slimChromeCUIListener);
	
	gNavBar.overflowable._onLazyResize = gNavBar.overflowable.__onLazyResize;
	gNavBar.overflowable.onOverflow = gNavBar.overflowable._onOverflow;
	gNavBar.overflowable._moveItemsBackToTheirOrigin = gNavBar.overflowable.__moveItemsBackToTheirOrigin;
	delete gNavBar.overflowable.__onLazyResize;
	delete gNavBar.overflowable._onOverflow;
	delete gNavBar.overflowable.__moveItemsBackToTheirOrigin;
	
	gNavToolbox.insertBefore(gNavBar, customToolbars);
	
	while(slimChromeToolbars.firstChild) {
		var e = gNavToolbox.externalToolbars.indexOf(slimChromeToolbars.firstChild);
		if(e != -1) {
			gNavToolbox.externalToolbars.splice(e, 1);
		}
		
		gNavToolbox.appendChild(slimChromeToolbars.firstChild);
	}
};
	
moduleAid.LOADMODULE = function() {
	overlayAid.overlayWindow(window, 'slimChrome', null, loadSlimChrome, unloadSlimChrome);
};

moduleAid.UNLOADMODULE = function() {
	styleAid.unload('personaSlimChrome_'+_UUID);
	overlayAid.removeOverlayWindow(window, 'slimChrome');
};