/**
 * Just flat-out fail the test with the given message
 */
function fail(message) {
  throw message;
}

/**
 * Asserts that the given expression is true and throws an exception with
 * a default message, or the optional +message+ parameter
 */
function assertTrue(expression, message) {
  if (! expression) {
    if (! message) message = "Assertion failed";
    throw message;
  }
}

/**
 * Asserts that the given regular expression matches the result of the 
 * given message.
 * @param pattern - the pattern to match
 * @param expression - the expression to match against
 * @param message - an optional string message
 */
function assertMatch(regExp, expression, message) {
  var defMessage = "'" + expression + "' does not match '" + regExp + "'";
  assertTrue(regExp.test(expression), message ? message + ": " + defMessage : defMessage);
}

/**
 * Assert that the +received+ object matches the +expected+ object (using
 * plain ol' ==). If it doesn't, this method throws an exception with either
 * a default message, or the one given as the last (optional) argument
 */
function assertEquals(expected, received, message) {
  var defMessage = "Expected <" + expected + "> but received <" + received + ">";
  assertTrue(expected == received, message ? message + ": " + defMessage : defMessage);
}

/**
 * Asserts that the given expression is false and otherwise throws an 
 * exception with a default message, or the optional +message+ parameter
 */
function assertFalse(expression, message) {
  assertTrue(! expression, message);
}

/**
 * Asserts that the given object is null or UIAElementNil (UIAutomation's
 * version of a null stand-in). If the given object is not one of these,
 * an exception is thrown with a default message or the given optional
 * +message+ parameter.
 */
function assertNull(thingie, message) {
  var defMessage = "Expected a null object, but received <" + thingie + ">"; 
  // TODO: string-matching on UIAElementNil makes my tummy feel bad. Fix it.
  assertTrue(thingie == null || thingie.toString() == "[object UIAElementNil]",
             message ? message + ": " + defMessage : defMessage);
}

/**
 * Asserts that the given object is not null or UIAElementNil (UIAutomation's
 * version of a null stand-in). If it is null, an exception is thrown with
 * a default message or the given optional +message+ parameter
 */
function assertNotNull(thingie, message) {
  var defMessage = "Expected not null object";
  assertTrue(thingie != null && thingie.toString() != "[object UIAElementNil]", 
             message ? message + ": " + defMessage : defMessage);
}

/**
 * Assert that the given window definition matches the current main window. The
 * window definition is a JavaScript object whose property hierarchy matches
 * the main UIAWindow.  Property names in the given definition that match a
 * method will cause that method to be invoked and the matching to be performed
 * and the result. For example, the UIAWindow exposes all UITableViews through
 * the tableViews() method. You only need to specify a 'tableViews' property to
 * cause the method to be invoked.
 *
 * PROPERTY HIERARCHY Property definitions can be nested as deeply as
 * necessary. Matching is done by traversing the same path in the main
 * UIAWindow as your screen definition. For example, to make assertions about
 * the left and right buttons in a UINavigationBar you can do this:
 *
 * assertWindow({
 *   navigationBar: {
 *     leftButton: { name: "Back" },
 *     rightButton: ( name: "Done" },
 *   }
 * });
 *
 * PROPERTY MATCHERS For each property you wish to make an assertion about, you
 * can specify a string, number regular expression or function. Strings and
 * numbers are matches using the assertEquals() method. Regular expressions are
 * matches using the assertMatch() method. 
 *
 * If you specify 'null' for a property, it means you don't care to match.
 * Typically this is done inside of arrays where you need to match the number
 * of elements, but don't necessarily care to make assertions about each one.
 *
 * Functions are given the matching property as the single argument. For
 * example:
 *
 * assertWindow({
 *   navigationBar: {
 *     leftButton: function(button) {
 *       // make custom assertions here
 *     }
 *   }
 * });
 *
 * ARRAYS
 * If a property you want to match is an array (e.g. tableViews()), you can
 * specify one of the above matchers for each element of the array. If the
 * number of provided matchers does not match the number of given elements, the
 * assertion will fail (throw an exception)
 *
 * In any case, you specify another object definition for each property to
 * drill-down into the atomic properties you wish to test. For example:
 *
 * assertWindow({
 *   navigationBar: {
 *     leftButton: { name: "Back" },
 *     rightButton: ( name: "Done" },
 *   },
 *   tableViews: [
 *     {
 *       groups: [
 *         { name: "First Group" },
 *         { name: "Second Group" }
 *       ],
 *       cells: [
 *         { name: "Cell 1" },
 *         { name: "Cell 2" },
 *         { name: "Cell 3" },
 *         { name: "Cell 4" }
 *       ]
 *     }
 *   ]
 * });
 *
 * HANDLING FAILURE If any match fails, an appropriate exception will be
 * thrown. If you are using the test structure provided by tuneup, this will be
 * caught and detailed correctly in Instruments.
 *
 * POST-PROCESSING If your screen definition provides an 'onPass' property that
 * points to a function, that function will be invoked after all matching has
 * been peformed on the current window and all assertions have passed. This
 * means you can assert the structure of your screen and operate on it in one
 * pass:
 *
 * assertWindow({
 *   navigationBar: {
 *     leftButton: { name: "Back" }
 *   },
 *   onPass: function(window) {
 *     var leftButton = window.navigationBar().leftButton();
 *     leftButton.tap();
 *   }
 * });
 */
function assertWindow(window) {
  target = UIATarget.localTarget();
  application = target.frontMostApp();
  mainWindow = application.mainWindow();
  
  try {
    if (window.onPass) {
      var onPass = window.onPass;
      delete window.onPass;
    }
    assertPropertiesMatch(window, mainWindow, 0);

    if (onPass) {
      onPass(mainWindow);
    }
  }
  catch(badProp) {
    fail("Failed to match " + badProp[0] + ": " + badProp[1]);
  }
};

/**
 * Asserts that the +expected+ object matches the +given+ object by making
 * assertions appropriate based on the type of each property in the 
 * +expected+ object. This method will recurse through the structure,
 * applying assertions for each matching property path. See the description
 * for +assertWindow+ for details on the matchers.
 */
function assertPropertiesMatch(expected, given, level) {
  for (var propName in expected) {
    if (expected.hasOwnProperty(propName)) {
      try {
        var expectedProp = expected[propName];
        var givenProp = given[propName];

        if (typeof(givenProp) == "function") {
          try {
            // We have to use eval (shudder) because calling functions on 
            // UIAutomation objects with () operator crashes
            // See Radar bug 8496138
            givenProp = eval("given." + propName + "()");
          }
          catch (e) {
            UIALogger.logDebug("Unable to evaluate given." + propName + "() against " + given);
            continue;
          }
        }

        // null indicates we don't care to match
        if (expectedProp == null) {
          continue;
        }

        if (givenProp == null) {
          throw propName;
        }

        if (typeof(expectedProp) == "string") {
          assertEquals(expectedProp, givenProp);
        }
        else if (typeof(expectedProp) == "number") {
          assertEquals(expectedProp, givenProp);
        }
        else if (typeof(expectedProp) == "function") {
          if (expectedProp.constructor == RegExp) {
            assertMatch(expectedProp, givenProp);
          }
          else {
            expectedProp(givenProp);
          }
        }
        else if (typeof(expectedProp) == "object") {
          if (expectedProp.constructor == Array) {
            assertEquals(expectedProp.length, givenProp.length, "Incorrect number of elements in array");
            for (var i = 0; i < expectedProp.length; i++) {
              var exp = expectedProp[i];
              var giv = givenProp[i];
              assertPropertiesMatch(exp, giv, level + 1);
            };
          }
          else if (typeof(givenProp) == "object") {
            assertPropertiesMatch(expectedProp, givenProp, level + 1);
          }
          else {
            throw propName;
          }
        }
      }
      catch(e) {
        if (e.constructor == Array) {
          e[0] = propName + "." + e[0];
          throw e;
        }
        else {
          var err = [propName, e];
          throw err;
        }
      }
    }
  }
};

