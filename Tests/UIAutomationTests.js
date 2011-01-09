// Examples of Apple's UI Automation testing

var target = UIATarget.localTarget();
var app = target.frontMostApp();
var window = app.mainWindow();

function testAddingANote(testName) {
	UIALogger.logStart(testName);
	try {
		//UIATarget.localTarget().logElementTree();

		// without the delay the element was not on the screen and could not be tapped.
		target.delay(2); 
		app.navigationBar().buttons()["Add"].tap();

		// without the delay the element was not on the screen and could not be tapped.
		target.delay(1);
		window.scrollViews()[0].textViews()["note"].setValue("CodeMash is cool!!!");
	
		app.navigationBar().buttons()["Save"].tap();
		
		// without the delay the element was not on the screen and could not be tapped.
		target.delay(1);

		cell = window.tableViews()[0].cells().firstWithPredicate("name beginswith 'CodeMash'")
		if(cell.isValid()) {
			UIALogger.logPass(testName);			
		} else {
			UIALogger.logFail(testName);
		}
		

	} catch (e) {
		UIALogger.logError(e);
		UIATarget.localTarget().logElementTree();
		UIALogger.logFail(testName);
	}
}

function testDisplayingHelp(testName) {
	UIALogger.logStart(testName);
	try {
		htmlIsDisplayed = false;
		
		app.toolbar().buttons()["Help"].tap();

		// without the delay the element was not on the screen and could not be tapped.		
		target.delay(1);
		target.captureScreenWithName("help_screen");
		
		// No good way to get to the URL or contents of a WebView
		webView = window.scrollViews()[0].webViews()[0];
		if("Create" == webView.links()[0].name()) {
			htmlIsDisplayed = true;
		}
		
		window.navigationBar().leftButton().tap();
		
		if(htmlIsDisplayed) {
			UIALogger.logPass(testName);
		} else {
			UIALogger.logFail(testName);
		}
		
	} catch (e) {
		UIALogger.logError(e);
		UIATarget.localTarget().logElementTree();
		UIALogger.logFail(testName);
	}
}

testDisplayingHelp("Open Help Test");
testAddingANote("Add Note Test");