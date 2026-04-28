mod budgets_db;
mod expenses_db;
mod inventory_categories_db;
mod members_db;
mod postgres_pool;
mod products_db;
mod promotions_db;
mod purchase_orders_db;
mod reports_db;
mod returns_db;
mod sale_adjustments_db;
mod sales_db;
mod staff_users_db;
mod suppliers_db;
mod vendors_db;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .invoke_handler(tauri::generate_handler![
      show_system_print_dialog,
      show_browser_print_dialog,
      inventory_categories_db::inventory_categories_load,
      inventory_categories_db::inventory_categories_replace_all,
      members_db::members_load,
      members_db::members_upsert,
      members_db::members_delete,
      members_db::member_ar_list,
      members_db::member_receive_payment,
      products_db::products_master_load,
      products_db::products_master_replace_all,
      products_db::get_product_images_dir,
      products_db::get_product_image_b64,
      products_db::get_product_images_b64,
      products_db::open_product_images_dir,
      products_db::list_product_image_skus,
      products_db::save_product_image_from_path,
      products_db::delete_product_image,
      sales_db::database_ping,
      sales_db::sales_create,
      sales_db::sales_day_summary,
      sales_db::sales_history_list,
      sales_db::sales_get_by_bill_no,
      sales_db::sales_history_by_member,
      sales_db::sales_member_summary,
      sales_db::sales_link_member_by_bill,
      sales_db::pos_bill_peek_next,
      sales_db::pos_bill_next,
      staff_users_db::staff_users_load,
      staff_users_db::staff_users_replace_all,
      reports_db::report_filter_options,
      reports_db::report_sales_summary,
      reports_db::report_top_products,
      reports_db::report_top_members,
      reports_db::report_tax_invoices,
      reports_db::report_slow_movers,
      reports_db::report_adjustments,
      reports_db::report_credit_notes,
      reports_db::report_stock_ledger,
      reports_db::report_ar_balances,
      reports_db::report_sales_by_category,
      reports_db::report_profit_margin,
      reports_db::report_member_segments,
      reports_db::report_rfm,
      reports_db::report_pnl,
      reports_db::report_abc_analysis,
      reports_db::report_dead_stock,
      expenses_db::expense_create,
      expenses_db::expense_list,
      expenses_db::expense_update,
      expenses_db::expense_delete,
      expenses_db::expense_approve,
      expenses_db::expense_reject,
      expenses_db::report_expenses,
      expenses_db::report_expense_comparison,
      budgets_db::budget_list,
      budgets_db::budget_upsert,
      budgets_db::budget_delete,
      budgets_db::report_budget_vs_actual,
      vendors_db::vendor_list,
      vendors_db::vendor_create,
      vendors_db::vendor_update,
      vendors_db::vendor_delete,
      vendors_db::vendor_spending,
      sale_adjustments_db::sale_void,
      sale_adjustments_db::sale_return_create,
      returns_db::return_list,
      returns_db::claim_list,
      returns_db::claim_create,
      returns_db::claim_update,
      returns_db::claim_delete,
      suppliers_db::supplier_list,
      suppliers_db::supplier_upsert,
      suppliers_db::supplier_delete,
      purchase_orders_db::po_list,
      purchase_orders_db::po_upsert,
      purchase_orders_db::po_delete,
      promotions_db::promotions_load,
      promotions_db::promotions_save,
      show_cfd_window
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // Hide the CFD window on close instead of destroying it so it can be reshown later.
      use tauri::Manager;
      if let Some(cfd_win) = app.get_webview_window("cfd") {
        cfd_win.clone().on_window_event(move |event| {
          if let tauri::WindowEvent::CloseRequested { api, .. } = event {
            api.prevent_close();
            let _ = cfd_win.hide();
          }
        });
      }

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[tauri::command]
fn show_cfd_window(app: tauri::AppHandle) -> Result<(), String> {
  use tauri::Manager;
  match app.get_webview_window("cfd") {
    Some(win) => {
      // Move to secondary monitor and go fullscreen; stay windowed on single-monitor setups.
      let mut has_secondary = false;
      if let (Ok(all), Ok(Some(primary))) = (app.available_monitors(), app.primary_monitor()) {
        let secondary = all.iter().find(|m| m.position() != primary.position());
        if let Some(monitor) = secondary {
          let pos = monitor.position();
          let _ = win.set_position(tauri::PhysicalPosition::new(pos.x, pos.y));
          has_secondary = true;
        }
      }
      win.show().map_err(|e| e.to_string())?;
      win.set_fullscreen(has_secondary).map_err(|e| e.to_string())?;
      win.set_focus().map_err(|e| e.to_string())?;
      Ok(())
    }
    None => Err("CFD window not found".to_string()),
  }
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

#[cfg(windows)]
fn show_browser_print_dialog_impl(webview: tauri::WebviewWindow) -> Result<(), String> {
  use std::sync::{Arc, Mutex};
  use webview2_com::Microsoft::Web::WebView2::Win32::{
    ICoreWebView2_16, COREWEBVIEW2_PRINT_DIALOG_KIND_BROWSER,
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
              if let Err(e) = core16.ShowPrintUI(COREWEBVIEW2_PRINT_DIALOG_KIND_BROWSER) {
                outcome = Err(format!("ShowPrintUI: {e}"));
              }
            }
          },
        }
      }
      if let Err(e) = outcome {
        *err_for_cb.lock().expect("browser print dialog error mutex poisoned") = Some(e);
      }
    })
    .map_err(|e| e.to_string())?;
  let err = {
    let mut g = err_slot.lock().expect("browser print dialog error mutex poisoned");
    g.take()
  };
  match err {
    None => Ok(()),
    Some(e) => Err(e),
  }
}

#[cfg(not(windows))]
fn show_browser_print_dialog_impl(_webview: tauri::WebviewWindow) -> Result<(), String> {
  Err("show_browser_print_dialog is only supported on Windows".into())
}

/// WebView2: เปิด browser print preview (มี Save as PDF เป็นตัวเลือกหลัก)
#[tauri::command]
fn show_browser_print_dialog(webview: tauri::WebviewWindow) -> Result<(), String> {
  show_browser_print_dialog_impl(webview)
}
