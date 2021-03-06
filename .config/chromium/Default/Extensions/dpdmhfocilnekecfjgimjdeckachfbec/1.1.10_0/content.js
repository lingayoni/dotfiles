// Generated by CoffeeScript 1.12.7
var EXTENSION_VERSION, close_onboarding, log_error, onboarding_event, promise_message_handler,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

EXTENSION_VERSION = chrome.runtime.getManifest().version;

document.head.setAttribute("data-dropbox-version", EXTENSION_VERSION);

promise_message_handler = function(message) {
  return new Promise(function(resolve, reject) {
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
      if (request.message === message) {
        resolve();
      }
    });
  });
};

log_error = function(err, log_func) {
  var extra;
  extra = {
    name: err.name,
    message: err.message
  };
  if (err.stack != null) {
    extra.stack = err.stack;
  }
  if (log_func != null) {
    log_func("unknown_app_error", extra);
  } else {
    Util.log("unknown_error", null, null, EXTENSION_VERSION, extra, null);
  }
  return console.error(err);
};

onboarding_event = promise_message_handler("onboarding_tab");

close_onboarding = promise_message_handler("close_onboarding");

Promise.all([
  InboxSDK.load('1', SDK_APP_ID, {
    inboxBeta: true
  }), InboxSDK.loadScript(DROPINS_URL), new Promise(function(resolve, reject) {
    return chrome.storage.local.get("guid", resolve);
  }), new Promise(function(resolve, reject) {
    return chrome.storage.sync.get("is_disabled", resolve);
  })
]).then(function(results) {
  var add_attachment_icon, add_custom_attachment_card, add_download_to_dropbox_button, add_save_all_button, augment_link_info, compose_view_handler, create_onboarding_flyout, create_photo_preview_elem, display_chooser, generate_attachment_icon_tooltip, get_all_saver_allowed_dbx_savable_files, get_link_previews, get_saveable_files, get_unique_filename, is_eligible_link, is_email_blacklisted, is_google_inbox, log, log_duplicate_filename, log_guid, log_key, message_view_handler, register_all_handlers, remove_tooltip, sdk, set_onboarding_tooltip_seen, shaObj, show_onboarding_tooltip, skip_onboarding, trigger_onboarding, update_options_with_saver_callbacks, update_save_options_with_files;
  sdk = results[0];
  log_guid = results[2].guid;
  shaObj = new jsSHA("SHA-1", "TEXT");
  shaObj.update(sdk.User.getEmailAddress());
  log_key = shaObj.getHash('HEX');
  skip_onboarding = false;
  is_google_inbox = Util.is_on_google_inbox();
  if (results[3].is_disabled) {
    return;
  }
  Dropbox.VERSION = 3;
  Dropbox.init({
    appKey: DROPINS_APP_KEY
  });
  log = function(event_name, extra, callback) {
    if (extra == null) {
      extra = {};
    }
    extra.is_google_inbox = is_google_inbox;
    return Util.log(event_name, log_guid, log_key, EXTENSION_VERSION, extra, callback);
  };
  register_all_handlers = function() {
    sdk.Compose.registerComposeViewHandler(compose_view_handler);
    sdk.Conversations.registerMessageViewHandler(message_view_handler);
    if (!skip_onboarding) {
      return onboarding_event.then(trigger_onboarding);
    }
  };
  compose_view_handler = function(compose_view) {
    var button;
    button = compose_view.addButton({
      title: chrome.i18n.getMessage("add_file"),
      iconUrl: chrome.runtime.getURL("images/logo.png"),
      type: 'MODIFIER',
      onClick: function() {
        return display_chooser(compose_view);
      }
    });
    if (!skip_onboarding) {
      skip_onboarding = true;
      chrome.storage.sync.get("seen_onboarding_tooltip", function(results) {
        if (!results.seen_onboarding_tooltip) {
          log("show_onboarding_tooltip");
          show_onboarding_tooltip(compose_view, button);
        }
      });
    }
  };
  message_view_handler = function(message_view) {
    var filtered_links, links;
    if (!is_email_blacklisted(message_view)) {
      links = message_view.getLinksInBody();
      filtered_links = links.filter(is_eligible_link).map(function(link) {
        return link.href;
      });
      if (filtered_links.length) {
        get_link_previews(filtered_links, function(response) {
          var j, len, link_info;
          if (response.length) {
            log("preview_render", {
              count: response.length
            });
          }
          for (j = 0, len = response.length; j < len; j++) {
            link_info = response[j];
            augment_link_info(link_info);
            add_custom_attachment_card(message_view, link_info);
          }
          add_attachment_icon(message_view, response);
          add_save_all_button(message_view, response);
        });
      } else {
        add_save_all_button(message_view);
      }
      add_download_to_dropbox_button(message_view);
    }
  };
  update_save_options_with_files = function(save_options, attachment_cards, dbx_savable_files) {
    var all_files, all_urls, dbx_files, fetch_all_urls_fn, file, j, len;
    if (attachment_cards == null) {
      attachment_cards = [];
    }
    if (dbx_savable_files == null) {
      dbx_savable_files = [];
    }
    dbx_files = JSON.parse(JSON.stringify(dbx_savable_files));
    if (attachment_cards.length > 0) {
      all_urls = [];
      all_files = [];
      get_saveable_files(dbx_files, attachment_cards, all_files, all_urls);
      for (j = 0, len = all_files.length; j < len; j++) {
        file = all_files[j];
        file.url = null;
      }
      fetch_all_urls_fn = function(on_success, selected_files) {
        var attachment_card, k, len1, on_reject, on_resolve, selected_filenames, url_promises;
        selected_filenames = (function() {
          var k, len1, results1;
          results1 = [];
          for (k = 0, len1 = selected_files.length; k < len1; k++) {
            file = selected_files[k];
            results1.push(file.filename);
          }
          return results1;
        })();
        url_promises = [];
        for (k = 0, len1 = attachment_cards.length; k < len1; k++) {
          attachment_card = attachment_cards[k];
          url_promises.push(attachment_card.getDownloadURL());
        }
        on_resolve = function(value) {
          var i, l, len2, ref, urls, urls_to_send;
          urls = all_urls.concat(value);
          urls_to_send = [];
          for (i = l = 0, len2 = all_files.length; l < len2; i = ++l) {
            file = all_files[i];
            if (ref = file.filename, indexOf.call(selected_filenames, ref) >= 0) {
              urls_to_send.push(urls[i]);
            }
          }
          on_success({
            urls: urls_to_send
          });
        };
        on_reject = function() {
          log("save_all_attachment_download_url_invalid");
          on_success(null);
        };
        return Promise.all(url_promises).then(on_resolve, on_reject);
      };
      save_options.files = all_files;
      return save_options.fetch_urls_fn = fetch_all_urls_fn;
    } else {
      return save_options.files = dbx_files;
    }
  };
  get_unique_filename = function(filename, file_names) {
    var base_name, counter, ext, new_name, ref, ref1;
    if (!(ref = filename.toLowerCase(), indexOf.call(file_names, ref) >= 0)) {
      return filename;
    } else {
      new_name = filename;
      base_name = Util.get_filename_no_ext(filename);
      ext = Util.get_ext(filename);
      counter = 1;
      while ((ref1 = new_name.toLowerCase(), indexOf.call(file_names, ref1) >= 0)) {
        new_name = base_name + " (" + counter + ")";
        if ((ext != null) && ext !== "") {
          new_name += "." + ext;
        }
        counter++;
      }
      return new_name;
    }
  };
  get_saveable_files = function(dbx_files, attachment_cards, files, urls) {
    var card, duplicate_file_found, file, file_names, filename, j, k, len, len1;
    file_names = [];
    duplicate_file_found = false;
    for (j = 0, len = dbx_files.length; j < len; j++) {
      file = dbx_files[j];
      file.filename = get_unique_filename(file.filename, file_names);
      file_names.push(file.filename.toLowerCase());
      files.push(file);
      if (urls != null) {
        urls.push(file.url);
      }
    }
    for (k = 0, len1 = attachment_cards.length; k < len1; k++) {
      card = attachment_cards[k];
      filename = card.getTitle();
      filename = get_unique_filename(filename, file_names);
      file_names.push(filename.toLowerCase());
      files.push({
        url: null,
        filename: filename
      });
    }
  };
  log_duplicate_filename = function() {
    return log("duplicate_filename_encountered");
  };
  get_all_saver_allowed_dbx_savable_files = function(links_info) {
    var dbx_savable_files, j, len, link_info;
    dbx_savable_files = [];
    for (j = 0, len = links_info.length; j < len; j++) {
      link_info = links_info[j];
      if (link_info.allow_saver) {
        dbx_savable_files.push({
          url: link_info.link,
          filename: link_info.title
        });
      }
    }
    return dbx_savable_files;
  };
  add_save_all_button = function(message_view, links_info) {
    var attachment_cards, dbx_savable_files, logging_info, saveable_file_count, saveable_files;
    if (links_info == null) {
      links_info = [];
    }
    attachment_cards = message_view.getFileAttachmentCardViews();
    dbx_savable_files = get_all_saver_allowed_dbx_savable_files(links_info);
    saveable_files = [];
    get_saveable_files(dbx_savable_files, attachment_cards, saveable_files);
    saveable_file_count = saveable_files.length;
    if (saveable_file_count > 1) {
      logging_info = {
        'dbx_link_count': dbx_savable_files.length,
        'attachment_count': attachment_cards.length
      };
      log("save_all_render", logging_info);
      message_view.addAttachmentsToolbarButton({
        iconUrl: chrome.runtime.getURL('images/logo.png'),
        tooltip: chrome.i18n.getMessage('saver_save_all_button_tooltip'),
        onClick: function() {
          var exts, file, save_options;
          save_options = {};
          update_save_options_with_files(save_options, attachment_cards, dbx_savable_files);
          exts = (function() {
            var j, len, ref, ref1, results1;
            ref = save_options.files;
            results1 = [];
            for (j = 0, len = ref.length; j < len; j++) {
              file = ref[j];
              results1.push(Util.get_ext((ref1 = file.filename) != null ? ref1 : ""));
            }
            return results1;
          })();
          update_options_with_saver_callbacks(exts, save_options, true);
          logging_info.exts = JSON.stringify(exts);
          log("save_all_click", logging_info);
          Dropbox.save(save_options);
        }
      });
    }
  };
  generate_attachment_icon_tooltip = function(links_info) {
    var file_names, link_info;
    file_names = (function() {
      var j, len, results1;
      results1 = [];
      for (j = 0, len = links_info.length; j < len; j++) {
        link_info = links_info[j];
        if (link_info.title != null) {
          results1.push(link_info.title);
        }
      }
      return results1;
    })();
    return file_names.join(chrome.i18n.getMessage('seperator'));
  };
  add_attachment_icon = function(message_view, links_info) {
    var attachment_icon_options;
    if (links_info == null) {
      links_info = [];
    }
    if (links_info.length > 0) {
      attachment_icon_options = {
        iconUrl: chrome.runtime.getURL('images/icon16.png'),
        tooltip: generate_attachment_icon_tooltip(links_info)
      };
      return message_view.addAttachmentIcon(attachment_icon_options);
    }
  };
  update_options_with_saver_callbacks = function(exts, save_options, is_save_all) {
    if (is_save_all == null) {
      is_save_all = false;
    }
    save_options.success = function() {
      var eventName;
      eventName = is_save_all ? "save_all_success" : "save_success";
      log(eventName, {
        exts: JSON.stringify(exts, {
          type: "shared_link"
        })
      });
      sdk.ButterBar.showMessage({
        text: chrome.i18n.getMessage('saver_success')
      });
    };
    save_options.progress = function(proportion) {
      sdk.ButterBar.showMessage({
        text: chrome.i18n.getMessage('saver_in_progress')
      });
    };
    save_options.error = function(err) {
      var eventName;
      eventName = is_save_all ? "save_all_failed" : "save_failed";
      log(eventName, {
        exts: JSON.stringify(exts, {
          error: err,
          type: "shared_link"
        })
      });
      sdk.ButterBar.showError({
        text: err != null ? err : chrome.i18n.getMessage('saver_error')
      });
    };
  };
  augment_link_info = function(link_info) {
    var ref;
    link_info.file_name = Util.get_filename_for_link(link_info.link);
    link_info.ext = Util.get_ext((ref = link_info.file_name) != null ? ref : "");
    link_info.title = link_info.display_name || link_info.file_name;
  };
  is_email_blacklisted = function(message_view) {
    var all_emails, email, emailHash, j, len;
    all_emails = message_view.getRecipientEmailAddresses();
    all_emails.push(message_view.getSender().emailAddress);
    for (j = 0, len = all_emails.length; j < len; j++) {
      email = all_emails[j];
      shaObj = new jsSHA("SHA-1", "TEXT");
      shaObj.update(email);
      emailHash = shaObj.getHash('HEX');
      if (indexOf.call(EMAIL_HASH_BLACKLIST, emailHash) >= 0) {
        return true;
      }
    }
    return false;
  };
  add_download_to_dropbox_button = function(message_view) {
    var attachment_card, attachment_cards, fn, j, len;
    attachment_cards = message_view.getFileAttachmentCardViews();
    fn = function(attachment_card) {
      var card_element, fetch_url_fn, ref;
      fetch_url_fn = function(on_success) {
        var on_fulfilled, on_rejected, url_promise;
        url_promise = attachment_card.getDownloadURL();
        on_fulfilled = function(download_url) {
          on_success({
            urls: [download_url]
          });
        };
        on_rejected = function() {
          log("attachment_download_url_invalid");
          on_success(null);
        };
        url_promise.then(on_fulfilled, on_rejected);
      };
      card_element = (ref = attachment_card._attachmentCardImplementation) != null ? typeof ref.getElement === "function" ? ref.getElement() : void 0 : void 0;
      if (card_element != null) {
        card_element.onclick = function() {
          var ext, filename;
          filename = attachment_card.getTitle();
          ext = Util.get_ext(filename != null ? filename : "");
          return log("interacted_with_real_attachment", {
            exts: JSON.stringify([ext])
          });
        };
      } else {
        log("interacted_click_tracking_failed");
      }
      return attachment_card.addButton({
        iconUrl: chrome.runtime.getURL('images/white_icon48.png'),
        tooltip: chrome.i18n.getMessage('saver_button_tooltip'),
        onClick: function() {
          var ext, exts, filename, save_options;
          filename = attachment_card.getTitle();
          ext = Util.get_ext(filename != null ? filename : "");
          exts = [ext];
          log("open_saver", {
            exts: JSON.stringify(exts, {
              type: "attachment"
            })
          });
          save_options = {};
          update_options_with_saver_callbacks(exts, save_options);
          save_options.files = [
            {
              url: fetch_url_fn,
              filename: filename
            }
          ];
          Dropbox.save(save_options);
        }
      });
    };
    for (j = 0, len = attachment_cards.length; j < len; j++) {
      attachment_card = attachment_cards[j];
      fn(attachment_card);
    }
    if (attachment_cards.length) {
      log("save_attachment_button_render", {
        count: attachment_cards.length
      });
    }
  };
  is_eligible_link = function(link) {
    return !link.isInQuotedArea && DBX_LINK_RE.test(link.href);
  };
  get_link_previews = function(links, callback) {
    var onload;
    onload = function(response) {
      var error, resp;
      if (response) {
        try {
          resp = JSON.parse(response);
          return callback(resp);
        } catch (error1) {
          error = error1;
          return log_error(error, log);
        }
      } else {
        return log_error(chrome.runtime.lastError, log);
      }
    };
    chrome.runtime.sendMessage(chrome.runtime.id, {
      message: "get_link_previews",
      links: links
    }, onload);
  };
  add_custom_attachment_card = function(message_view, link_info) {
    var buttons, card_params, ext, icon;
    ext = link_info.ext;
    card_params = {
      title: link_info.title,
      previewUrl: link_info.link,
      fileIconImageUrl: chrome.runtime.getURL('images/icon16.png'),
      foldColor: "#007EE5",
      description: link_info.description,
      previewOnClick: function() {
        log("preview_click", {
          ext: ext
        });
      }
    };
    buttons = [];
    if (link_info.dl_link != null) {
      buttons.push({
        downloadUrl: link_info.dl_link,
        onClick: function() {
          return log("download_link", {
            ext: ext
          });
        }
      });
    }
    if (link_info.allow_saver) {
      buttons.push({
        iconUrl: chrome.runtime.getURL('images/white_icon48.png'),
        tooltip: chrome.i18n.getMessage('saver_button_tooltip'),
        onClick: function() {
          var exts, save_options;
          exts = [ext];
          log("open_saver", {
            exts: JSON.stringify(exts, {
              type: "shared_link"
            })
          });
          save_options = {};
          update_options_with_saver_callbacks(exts, save_options);
          save_options.files = [
            {
              url: link_info.link,
              filename: card_params.title
            }
          ];
          Dropbox.save(save_options);
        }
      });
    }
    card_params['buttons'] = buttons;
    icon = link_info.file_icon || chrome.runtime.getURL('images/icon128.png');
    if (link_info.preview_link != null) {
      card_params['previewThumbnailUrl'] = link_info.preview_link;
      card_params['failoverPreviewIconUrl'] = icon;
      message_view.addAttachmentCardView(card_params);
    } else {
      card_params['iconThumbnailUrl'] = icon;
      message_view.addAttachmentCardViewNoPreview(card_params);
    }
  };
  display_chooser = function(compose_view) {
    var chooser_wrapper, cleanup, modal, modal_elm, on_cancel, on_message, on_success;
    log("open_chooser");
    on_success = function(files) {
      var bounding_box, ext_array, file, is_photo, j, len, mode, photo_elem, ref, ref1, thumbnail_link;
      if (compose_view.getSelectedBodyText() && files.length === 1) {
        file = files[0];
        log("insert_link", {
          ext: Util.get_ext((ref = file.name) != null ? ref : "")
        });
        compose_view.insertLinkIntoBodyAtCursor(file.name, file.link);
      } else {
        ext_array = [];
        for (j = 0, len = files.length; j < len; j++) {
          file = files[j];
          ext_array.push(Util.get_ext((ref1 = file.name) != null ? ref1 : ""));
          thumbnail_link = file.thumbnailLink;
          is_photo = Util.is_photo(file.name) && thumbnail_link && !file.isDir;
          if (thumbnail_link) {
            bounding_box = is_photo ? "800" : "75";
            mode = is_photo ? "fit" : "crop";
            thumbnail_link = thumbnail_link.split("?")[0] + ("?bounding_box=" + bounding_box + "&mode=" + mode);
          } else if (file.isDir) {
            thumbnail_link = CDN_BASE + "/static/images/gmail_attachment_folder_icon.png";
          } else {
            thumbnail_link = CDN_BASE + "/static/images/logo_catalog/gmail_attachment_logo_m1.png";
          }
          if (is_photo) {
            photo_elem = create_photo_preview_elem(file, thumbnail_link);
            compose_view.insertHTMLIntoBodyAtCursor(photo_elem);
          } else {
            compose_view.insertLinkChipIntoBodyAtCursor(file.name, file.link, thumbnail_link);
          }
        }
        log("insert_link", {
          exts: JSON.stringify(ext_array)
        });
      }
      modal.close();
      cleanup();
    };
    on_cancel = function() {
      modal.close();
      cleanup();
    };
    on_message = function(evt) {
      var data, dest;
      if (evt.source.parent === chooser_wrapper.contentWindow) {
        data = JSON.parse(evt.data);
        dest = evt.source;
        switch (data.method) {
          case "origin_request":
            evt.source.postMessage(JSON.stringify({
              method: "origin"
            }), DROPBOX_BASE);
            break;
          case "files_selected":
            on_success(data.params);
            break;
          case "close_dialog":
            on_cancel();
        }
      }
    };
    window.addEventListener("message", on_message, false);
    cleanup = function() {
      window.removeEventListener("message", on_message, false);
    };
    chooser_wrapper = document.createElement("iframe");
    chooser_wrapper.src = chrome.runtime.getURL("blank.html");
    chooser_wrapper.style.display = "block";
    chooser_wrapper.style.width = "640px";
    chooser_wrapper.style.height = "552px";
    chooser_wrapper.style.maxWidth = "100%";
    chooser_wrapper.style.border = "none";
    modal = sdk.Modal.show({
      el: chooser_wrapper,
      chrome: false
    });
    modal_elm = chooser_wrapper.parentElement.parentElement;
    modal_elm.style.border = "1px solid rgba(71, 82, 93, 0.2)";
    modal_elm.style.borderRadius = "4px";
    modal_elm.style.boxShadow = "0 0 10px 2px rgba(123, 137, 148, 0.1)";
  };
  create_photo_preview_elem = function(file, thumbnail_link) {
    var img, img_container, link, link_container, preview_container;
    preview_container = document.createElement('div');
    img_container = document.createElement('div');
    img = document.createElement('img');
    img.src = thumbnail_link;
    img.style.maxWidth = "425px";
    img.style.maxHeight = "800px";
    img_container.appendChild(img);
    preview_container.appendChild(img_container);
    link_container = document.createElement('div');
    link = document.createElement('a');
    link.href = file.link;
    link.textContent = file.name;
    link_container.appendChild(link);
    preview_container.appendChild(link_container);
    return preview_container;
  };
  trigger_onboarding = function() {
    sdk.Compose.openNewComposeView();
  };
  show_onboarding_tooltip = function(compose_view, button) {
    document.addEventListener("animationstart", function(event) {
      var safe_overlay;
      if (event.animationName === "tooltip_appeared") {
        document.getElementById('default-flyout-button').focus();
        safe_overlay = document.createElement("div");
        safe_overlay.className = "onboarding-overlay";
        safe_overlay.addEventListener("click", function(event) {
          event.preventDefault();
          log("onboarding-dismissed-by-click-outside");
          remove_tooltip(button);
          return set_onboarding_tooltip_seen();
        });
        document.body.appendChild(safe_overlay);
      }
    });
    return button.showTooltip({
      el: create_onboarding_flyout(compose_view, button)
    });
  };
  set_onboarding_tooltip_seen = function() {
    chrome.storage.sync.set({
      "seen_onboarding_tooltip": true
    });
    chrome.runtime.sendMessage({
      message: "onboarding_tooltip_seen"
    });
  };
  remove_tooltip = function(button) {
    var j, len, overlay, ref;
    button.closeTooltip();
    ref = document.getElementsByClassName("onboarding-overlay");
    for (j = 0, len = ref.length; j < len; j++) {
      overlay = ref[j];
      overlay.style.display = "none";
    }
  };
  create_onboarding_flyout = function(compose_view, button) {
    var el, onboarding_title, tooltip_confirm, tooltip_disable, tooltip_dismiss, tooltip_instant, tooltip_large_files, tooltip_learn_more, tooltip_safe;
    close_onboarding.then(function() {
      remove_tooltip(button);
    });
    el = document.createElement("div");
    el.setAttribute("class", "onboarding-flyout-container");
    onboarding_title = chrome.i18n.getMessage("onboarding_title");
    tooltip_large_files = chrome.i18n.getMessage("tooltip_large_files");
    tooltip_instant = chrome.i18n.getMessage("tooltip_instant");
    tooltip_safe = chrome.i18n.getMessage("tooltip_safe");
    tooltip_confirm = chrome.i18n.getMessage("tooltip_confirm");
    tooltip_dismiss = chrome.i18n.getMessage("tooltip_dismiss");
    tooltip_disable = chrome.i18n.getMessage("tooltip_disable");
    tooltip_learn_more = chrome.i18n.getMessage("tooltip_learn_more");
    el.innerHTML = "<img src=" + (chrome.runtime.getURL('images/x.png')) + " class='onboarding-dismiss-x' aria-label='" + tooltip_dismiss + "'> <div class='onboarding-title'> " + onboarding_title + " </div> <ul class='onboarding-tip-list'> <li>" + tooltip_large_files + "</li> <li>" + tooltip_instant + "</li> <li>" + tooltip_safe + "</li> </ul> <div class='onboarding-buttons' > <button class='button-primary onboarding-confirm' id='default-flyout-button'>" + tooltip_confirm + "</button> </div> <div class='onboarding-footer-divider'></div> <div class='onboarding-footer'> <a href='' class='onboarding-disable'>" + tooltip_disable + "</a> <a target='_blank' href='https://www.dropbox.com/help/8807'>" + tooltip_learn_more + "</a> </div>";
    el.getElementsByClassName("onboarding-confirm")[0].addEventListener("click", function(event) {
      event.preventDefault();
      log('onboarding-confirmed');
      display_chooser(compose_view);
      remove_tooltip(button);
    });
    el.getElementsByClassName("onboarding-disable")[0].addEventListener("click", function(event) {
      event.preventDefault();
      log('onboarding-disable-clicked', {}, function() {
        chrome.runtime.sendMessage(chrome.runtime.id, {
          message: "uninstall_self"
        });
      });
      remove_tooltip(button);
    });
    el.getElementsByClassName("onboarding-dismiss-x")[0].addEventListener("click", function(event) {
      event.preventDefault();
      log('onboarding-dismissed');
      remove_tooltip(button);
    });
    el.addEventListener("click", function(event) {
      set_onboarding_tooltip_seen();
    });
    return el;
  };
  log("load");
  register_all_handlers();
})["catch"](function(err) {
  log_error(err, null);
});
