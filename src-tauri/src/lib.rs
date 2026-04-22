mod inventory_categories_db;
mod members_db;
mod postgres_pool;
mod products_db;
mod sales_db;
mod staff_users_db;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      show_system_print_dialog,
      inventory_categories_db::inventory_categories_load,
      inventory_categories_db::inventory_categories_replace_all,
      members_db::members_load,
      members_db::members_upsert,
      members_db::members_delete,
      products_db::products_master_load,
      products_db::products_master_replace_all,
      products_db::get_product_images_dir,
      products_db::list_product_image_skus,
      sales_db::database_ping,
      sales_db::sales_create,
      sales_db::sales_day_summary,
      sales_db::sales_history_list,
      sales_db::sales_get_by_bill_no,
      sales_db::sales_history_by_member,
      sales_db::pos_bill_peek_next,
      sales_db::pos_bill_next,
      staff_users_db::staff_users_load,
      staff_users_db::staff_users_replace_all
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[cfg(windows)]
fn show_system_print_dialog_impl(webview: tauri::WebviewWindow) -> Result<(), String> {
  use std::sync::{Arc, Mutex};
  use webview2_com::Microsoft::Web::WebView2::Win32::{
    ICoreWebView2_16, COREWEBVIEW2_PRINT_DIALOG_KIND_SYSTEM,
  };
  use windows_core::Interface;

  let err_slot = Arc::new(Mutex::new(None::<String>));
  let err_for_cb = Arc::clone(&err_slot);
  webview
    .with_webview(move |w| {
      let mut outcome: Result<(), String> = Ok(());
      unsafe {
        let controller = w.controller();
        match controller.CoreWebView2() {
          Err(e) => outcome = Err(format!("CoreWebView2: {e}")),
          Ok(core) => match core.cast::<ICoreWebView2_16>() {
            Err(e) => outcome = Err(format!("ICoreWebView2_16: {e}")),
            Ok(core16) => {
              if let Err(e) = core16.ShowPrintUI(COREWEBVIEW2_PRINT_DIALOG_KIND_SYSTEM) {
                outcome = Err(format!("ShowPrintUI: {e}"));
              }
            }
          },
        }
      }
      if let Err(e) = outcome {
        *err_for_cb.lock().expect("print dialog error mutex poisoned") = Some(e);
      }
    })
    .map_err(|e| e.to_string())?;
  let err = {
    let mut g = err_slot.lock().expect("print dialog error mutex poisoned");
    g.take()
  };
  match err {
    None => Ok(()),
    Some(e) => Err(e),
  }
}

#[cfg(not(windows))]
fn show_system_print_dialog_impl(_webview: tauri::WebviewWindow) -> Result<(), String> {
  Err("show_system_print_dialog is only supported on Windows".into())
}

/// WebView2: เปิดกล่องพิมพ์ของระบบ (เทียบเท่า Print using system dialog) แทนพรีวิวของ Edge
#[tauri::command]
fn show_system_print_dialog(webview: tauri::WebviewWindow) -> Result<(), String> {
  show_system_print_dialog_impl(webview)
}
