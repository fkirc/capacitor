package com.captemplate;

import android.net.Uri;
import android.os.Bundle;

import androidx.appcompat.app.AppCompatActivity;

import com.getcapacitor.BridgeFragment;

public class MainActivity extends AppCompatActivity implements BridgeFragment.OnFragmentInteractionListener {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    setContentView(R.layout.activity_main);
  }

  @Override
  public void onFragmentInteraction(Uri uri) {
    // Ignore
  }
}
