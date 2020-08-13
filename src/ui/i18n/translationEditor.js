//

// ## SmoTranslationEditor
// Create a somewhat user-friendly editor DOM to translate SMO
// dialogs and menus, and any subset, into other languages.
class SmoTranslationEditor {

   // ### _getHtmlTextInput
   // All the editable text elements contain: the code label or value from the
   // UI element, the En string, and  the translated string, or a copy of the
   // EN string if the string has not been translated.
    static _getHtmlTextInput(dbLabel,enLabel,langLabel,labelType,labelId) {
      var b = htmlHelpers.buildDom;

      const compHtml = b('div').classes('dialog-element-container')
        .attr('data-'+labelType,labelId).append(
          b('div').classes('dialog-component-label').append(
            b('span').classes('trans-label').append(
              b('span').classes('trans-db-text').text(dbLabel)
            ).append(
              b('span').classes('trans-en-text').text(enLabel)
            ).append(
              b('input').classes('trans-label-input')
            ).append(
              b('span').classes('plaintext-translate hide').text(langLabel)
            )
          )
        ).dom();
      return compHtml;
    }

    // ### _getMenuTextDialogHtml
    // Get all the menu item labels for translation
    static _getMenuTextDialogHtml(menuCtor,enStrings,langStrings) {
      const menuClass = eval(menuCtor);
      const menuItems = menuClass['defaults'].menuItems;
      var enMenu = enStrings.find((mn) => mn.ctor === menuCtor);

      // Get the JSON EN menu, or copy the DB strings if it doesn't exist
      if (!enMenu) {
        enMenu = JSON.parse(JSON.stringify(menuClass['defaults']));
        enMenu.ctor = menuCtor;
      }
      // Get the JSON language menu strings, or copy the EN strings if it doesn't exist
      var langMenu = langStrings.find((mn) => mn.ctor === menuCtor);
      if (!langMenu) {
        langMenu = JSON.parse(JSON.stringify(menuClass['defaults']));
        langMenu.ctor = menuCtor;
      }

      // create the DOM menu container
      var b = htmlHelpers.buildDom;
      const container = b('div').classes('menu-translate-container')
        .attr('data-menucontainer',menuCtor).append(
          b('button').classes('icon-plus trans-expander')).append(
            b('span').classes('menu-translate-title').text(menuCtor)
        ).dom();
      const menuItemsDom = b('div').classes('menu-element-container').dom();

      // create the label editor
      const menuLabel = SmoTranslationEditor._getHtmlTextInput(menuClass['defaults'].label,enMenu.label,langMenu.label,
        'menulabel',menuCtor);
      $(menuItemsDom).append(menuLabel);
      $(container).append(menuItemsDom);

      // create the editor for each item
      menuItems.forEach((item) => {
        var enItem  = enMenu.menuItems.find((mi) => mi.value === item.value);
        if (!enItem) {
          enItem = JSON.parse(JSON.stringify(item));
        }
        var langItem = langMenu.menuItems.find((mi) => mi.value === item.value);
        if (!langItem) {
          langItem = JSON.parse(JSON.stringify(item));
        }
        const menuItemDom = b('div').classes('menu-item-container').dom();
        const itemEditDom = SmoTranslationEditor._getHtmlTextInput(
          item.value,enItem.text,langItem.text,
          'itemtext',item.value);
        $(menuItemDom).append(itemEditDom);
        $(menuItemsDom).append(menuItemDom);
      });
      return container;
    }

    static _getStaticTextDialogHtml(dialogCtor,element,enDb,langDb,htmlContainer) {
      var b = htmlHelpers.buildDom;

      const dbObj = element.staticText;
      var enStNode = enDb.find((st) => st.staticText);
      if (!enStNode) {
        const enStString = JSON.parse(JSON.stringify(element.staticText));
        enStNode = { staticText:enStString };
        enDb.push({ staticText:enStString });
      }
      var langStNode = langDb.find((st) => st.staticText);
      if (!langStNode|| !langStNode.staticText) {
        const langStString = JSON.parse(JSON.stringify(element.staticText));
        langStNode = { staticText: langStString};
        langDb.push(langStNode);
      }
      const enObj = enStNode.staticText;
      const langObj = langStNode.staticText;
      const nodeContainer = b('div')
        .classes('dialog-element-container')
        .attr('data-component','staticText')
        .dom();
      $(htmlContainer).append(nodeContainer);
      const elKeys = dbObj.map((st) => Object.keys(st)[0]);
      elKeys.forEach((elKey) => {
        var dbVal = dbObj.find((st) => st[elKey]);
        var enVal = enObj.find((st) => st[elKey]);
        var langVal = langObj.find((st) => st[elKey]);
        if (!enVal) {
          enVal = dbVal;
        }
        if (!langVal) {
          langVal = dbVal;
        }
        const translateElement = SmoTranslationEditor._getHtmlTextInput(
          elKey,enVal[elKey],langVal[elKey],'statictext',elKey);
        $(nodeContainer).append(translateElement);
      });
    }

    static _getDialogComponentHtml(dialogCtor,element,enDb,langDb,container) {
      var b = htmlHelpers.buildDom;

      var label = element.label;
      var smoName = element.smoName;
      var enComponent = enDb.find((st) => st.id === smoName);
      if (!enComponent) {
        enComponent = JSON.parse(JSON.stringify(element))
      }
      var langComponent = langDb.find((st) => st.id === smoName);
      if (!langComponent) {
        langComponent = JSON.parse(JSON.stringify(element));
      }
      const enLabel = enComponent.label ? enComponent.label : label;
      const langLabel = langComponent.label ? langComponent.label : label;
      const compHtml = SmoTranslationEditor._getHtmlTextInput(
        label,enLabel,langLabel,'component',smoName);

      if (element.options) {
        const optionsHtml = b('div').classes('dialog-component-options').dom();
        $(compHtml).append(optionsHtml);
        if (!enComponent.options) {
          enComponent.options = JSON.parse(JSON.stringify(element.options));
        }
        if (!langComponent.options) {
          langComponent.options = JSON.parse(JSON.stringify(element.options));
        }

        element.options.forEach((option) => {
          var enOption = enComponent.options.find((op) => op.value === option.value);
          var langOption = langComponent.options.find((op) => op.value === option.value);
          if (!enOption || !enOption.label) {
            enOption = JSON.parse(JSON.stringify(option));
          }
          if (!langOption || !langOption.label) {
            langOption = JSON.parse(JSON.stringify(option));
          }
          const optionHtml =  SmoTranslationEditor._getHtmlTextInput(
            option.value,enOption.label,langOption.label,'component-option',option.value);
            $(optionsHtml).append(optionHtml)
        });
        $(container).append(compHtml);
      }
    }

    static getDialogTranslationHtml(dialogCtor,enStrings,langStrings) {
      var b = htmlHelpers.buildDom;
      var container = b('div').classes('db-translate-container').attr('data-dbcontainer',dialogCtor)
        .append(b('button').classes('icon-plus trans-expander'))
        .append(b('span').classes('db-translate-title').text(dialogCtor)).dom();
      var ctor = eval(dialogCtor);
      var elements = ctor.dialogElements;
      var enDb = enStrings.find((dbStr) => dbStr.ctor === dialogCtor);
      if (!enDb) {
        enDb = JSON.parse(JSON.stringify(elements));
      } else {
        enDb = enDb.dialogElements;
      }
      var langDb = langStrings.find((dbStr) => dbStr.ctor === dialogCtor);
      if (!langDb) {
        langDb = JSON.parse(JSON.stringify(elements));
      } else {
        langDb = langDb.dialogElements;
      }
      elements.forEach((element) => {
        if (element.staticText) {
          SmoTranslationEditor._getStaticTextDialogHtml(dialogCtor,element,enDb,langDb,container);
        } else if (element.smoName) {
          SmoTranslationEditor._getDialogComponentHtml(dialogCtor,element,enDb,langDb,container);
        }
      });
      return container;
    }
    static getAllTranslationHtml(lang) {
      var enStr = SmoLanguage.en.strings
      var langStr = SmoLanguage[lang].strings;
      var b = htmlHelpers.buildDom;
      var container = b('div').classes('top-translate-container').dom();
      SmoTranslator.allDialogs.forEach((dialog) => {
        $(container).append(SmoTranslationEditor.getDialogTranslationHtml(dialog,enStr,langStr))
      });
      SmoTranslator.allMenus.forEach((menu) => {
        $(container).append(SmoTranslationEditor._getMenuTextDialogHtml(menu,enStr,langStr));
      })
      return container;
    }
    static startEditor(lang) {
      var transDom =  SmoTranslationEditor.getAllTranslationHtml(lang);
      $('.translation-editor').append(transDom);
      $('body').addClass('translation-mode');
      $('.plaintext-translate').each(function(ix,el) {
        var txt = $(this).text();
        var input = $(this).closest('.trans-label').find('input.trans-label-input').val(txt);
      });

      $('.db-translate-container button.trans-expander').off('click').on('click', function() {
        var exp = $(this).closest('.db-translate-container');
        if ($(exp).hasClass('expanded')) {
          $(exp).removeClass('expanded');
          $(this).removeClass('icon-minus');
          $(this).addClass('icon-plus');
        } else {
          $(exp).addClass('expanded');
          $(this).addClass('icon-minus');
          $(this).removeClass('icon-plus');
        }
      });
      $('.menu-translate-container button.trans-expander').off('click').on('click', function() {
        var exp = $(this).closest('.menu-translate-container');
        if ($(exp).hasClass('expanded')) {
          $(exp).removeClass('expanded');
          $(this).removeClass('icon-minus');
          $(this).addClass('icon-plus');
        } else {
          $(exp).addClass('expanded');
          $(this).addClass('icon-minus');
          $(this).removeClass('icon-plus');
        }
      });


    }

}
