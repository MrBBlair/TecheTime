#!/bin/bash

# Helper script to display Firestore rules for easy copy-paste to Firebase Console

echo "=========================================="
echo "Firestore Security Rules"
echo "=========================================="
echo ""
echo "Copy the rules below and paste them into:"
echo "https://console.firebase.google.com/project/tech-etime-21021/firestore/rules"
echo ""
echo "=========================================="
echo ""
cat firestore.rules
echo ""
echo "=========================================="
echo ""
echo "After pasting, click 'Publish' to deploy."
echo ""
