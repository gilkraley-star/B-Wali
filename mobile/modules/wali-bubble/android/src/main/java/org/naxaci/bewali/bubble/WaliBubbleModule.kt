package org.naxaci.bewali.bubble

import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.ImageView
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// Bulle flottante Wali : une petite icône qui reste par-dessus les autres applications quand Wali est quittée.
// Un appui rouvre Wali ; on peut la déplacer. Elle n'est active que si la fille l'a choisi dans Réglages.
class WaliBubbleModule : Module() {
  private val main = Handler(Looper.getMainLooper())
  private var view: View? = null
  private var enabled = false
  private var inForeground = true

  private val ctx: Context get() = appContext.reactContext!!.applicationContext
  private val wm: WindowManager get() = ctx.getSystemService(Context.WINDOW_SERVICE) as WindowManager

  override fun definition() = ModuleDefinition {
    Name("WaliBubble")

    Function("canDraw") { Settings.canDrawOverlays(ctx) }

    Function("requestPermission") {
      val i = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + ctx.packageName))
      i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      ctx.startActivity(i)
    }

    // enabled : l'option est activée ; foreground : Wali est au premier plan (la bulle est alors cachée)
    Function("configure") { enable: Boolean, foreground: Boolean ->
      enabled = enable
      inForeground = foreground
      main.post { refresh() }
    }

    OnDestroy { main.post { remove() } }
  }

  private fun refresh() {
    if (enabled && !inForeground && Settings.canDrawOverlays(ctx)) show() else remove()
  }

  private fun remove() {
    view?.let { try { wm.removeView(it) } catch (_: Exception) {} }
    view = null
  }

  private fun dp(v: Int) = (v * ctx.resources.displayMetrics.density).toInt()

  private fun show() {
    if (view != null) return
    val size = dp(58)
    val icon = ImageView(ctx).apply {
      try { setImageDrawable(ctx.packageManager.getApplicationIcon(ctx.packageName)) } catch (_: Exception) {}
      scaleType = ImageView.ScaleType.CENTER_CROP
      setPadding(dp(6), dp(6), dp(6), dp(6))
      background = GradientDrawable().apply { shape = GradientDrawable.OVAL; setColor(Color.WHITE) }
      elevation = dp(8).toFloat()
    }
    val type = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY // minSdk 24 : Android 8+ pour les bulles
    val lp = WindowManager.LayoutParams(size, size, type, WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS, PixelFormat.TRANSLUCENT).apply {
      gravity = Gravity.TOP or Gravity.START
      x = ctx.resources.displayMetrics.widthPixels - size - dp(8)
      y = dp(220)
    }
    var sx = 0f; var sy = 0f; var ox = 0; var oy = 0; var moved = false
    icon.setOnTouchListener { _, e ->
      when (e.action) {
        MotionEvent.ACTION_DOWN -> { sx = e.rawX; sy = e.rawY; ox = lp.x; oy = lp.y; moved = false; true }
        MotionEvent.ACTION_MOVE -> {
          val dx = (e.rawX - sx).toInt(); val dy = (e.rawY - sy).toInt()
          if (Math.abs(dx) > dp(6) || Math.abs(dy) > dp(6)) moved = true
          lp.x = ox + dx; lp.y = oy + dy
          try { wm.updateViewLayout(icon, lp) } catch (_: Exception) {}
          true
        }
        MotionEvent.ACTION_UP -> {
          if (!moved) {
            val launch = ctx.packageManager.getLaunchIntentForPackage(ctx.packageName)
            launch?.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
            if (launch != null) ctx.startActivity(launch)
          }
          true
        }
        else -> false
      }
    }
    try { wm.addView(icon, lp); view = icon } catch (_: Exception) {}
  }
}
