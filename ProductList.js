import React, { useEffect, useState } from 'react';
import { db, storage } from '../firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

export default function ProductList() {
  const [products, setProducts] = useState([]);
  useEffect(() => {
    async function fetch() {
      const snap = await getDocs(collection(db, 'products'));
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    fetch();
  }, []);

  return (
    <div>
      <h2>المنتجات</h2>
      <ul>
        {products.map(p => <li key={p.id}><strong>{p.name_ar}</strong> — {p.category} — {p.variants && p.variants[0].price} YER</li>)}
      </ul>
      <p>لرفع/إضافة منتجات استخدم الواجهة أو سكربت التهيئة (مرفق).</p>
    </div>
  );
}