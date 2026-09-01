'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const test = require('node:test');
const { configureSessionPermissions } = require('../src/window-manager');

test('session permissions allow trusted notifications and write-only clipboard access', () => {
  let checkPermission;
  let requestPermission;
  const electronSession = {
    setPermissionCheckHandler(handler) {
      checkPermission = handler;
    },
    setPermissionRequestHandler(handler) {
      requestPermission = handler;
    },
  };
  const gameRoot = path.resolve('tmp', 'game');
  const trustedContents = {
    getURL: () => pathToFileURL(path.join(gameRoot, 'index.html')).href,
  };
  const untrustedContents = {
    getURL: () => pathToFileURL(path.resolve('tmp', 'outside.html')).href,
  };

  configureSessionPermissions(electronSession, [gameRoot]);

  assert.equal(checkPermission(trustedContents, 'notifications'), true);
  assert.equal(
    checkPermission(trustedContents, 'clipboard-sanitized-write'),
    true,
  );
  assert.equal(checkPermission(trustedContents, 'clipboard-read'), false);
  assert.equal(checkPermission(trustedContents, 'media'), false);
  assert.equal(checkPermission(untrustedContents, 'notifications'), false);
  assert.equal(checkPermission(null, 'notifications'), false);

  let requestResult;
  requestPermission(
    trustedContents,
    'clipboard-sanitized-write',
    (allowed) => {
      requestResult = allowed;
    },
  );
  assert.equal(requestResult, true);

  requestPermission(trustedContents, 'clipboard-read', (allowed) => {
    requestResult = allowed;
  });
  assert.equal(requestResult, false);
});
