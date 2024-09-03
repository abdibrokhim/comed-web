import { Page, Text, View, Document, StyleSheet, renderToStream, Image, Font } from '@react-pdf/renderer';
import { Timestamp } from 'firebase/firestore';
import { NextResponse } from 'next/server';

const studyType = "PROTOCOL OF MRI STUDY OF THE BRAIN";
const disclaimerA = 'This conclusion is not a final diagnosis and requires comparison with clinical and laboratory data.';
const disclaimerB = `In case of typos, contact phone: `;

Font.register({
  family: 'Oswald',
  src: 'https://fonts.gstatic.com/s/oswald/v13/Y_TKV6o8WovbUd3m_X9aAA.ttf'
});

const styles = StyleSheet.create({
  body: {
    paddingTop: 35,
    paddingBottom: 65,
    paddingHorizontal: 35,
  },
  subSubTitle: {
    fontSize: 16,
    textAlign: 'left',
    fontFamily: 'Oswald'
  },
  infoHeader: {
    borderBottom: 1,
    marginBottom: 4,
    fontSize: 10,
    textAlign: 'left',
    fontFamily: 'Oswald'
  },
  author: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 40,
  },
  subtitle: {
    fontSize: 16,
    margin: 10,
    fontFamily: 'Oswald'
  },
  headerTitle: {
    fontSize: 14,
    marginTop: 6,
    marginBottom: 6,
    fontFamily: 'Oswald'
  },
  headerTitleWithBorder: {
    borderBottom: 1,
    fontSize: 14,
    marginTop: 6,
    marginBottom: 6,
    fontFamily: 'Oswald'
  },
  headerTitleCentered: {
    textAlign: 'center',
    fontSize: 10,
    marginTop: 6,
    marginBottom: 6,
    fontFamily: 'Oswald'
  },
  makeRow: {
    marginTop: 4,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  text: {
    marginTop: 2,
    marginBottom: 2,
    fontSize: 8,
    fontFamily: 'Times-Roman'
  },
  notes: {
    marginTop: 1,
    marginBottom: 2,
    fontSize: 6,
    textAlign: 'left',
    fontFamily: 'Times-Roman'
  },
  headerText: {
    fontSize: 8,
    fontFamily: 'Times-Roman'
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 10,
  },
  imageCenter: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  header: {
    marginBottom: 10,
    textAlign: 'center',
    color: 'black',
  },
  footer: {
    marginBottom: 20,
    textAlign: 'center',
    color: 'grey',
    bottom: 10,
    margin: 'auto',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 6,
    textAlign: 'center',
    marginBottom: 4,
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 12,
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: 'grey',
  },
  section: {
    marginBottom: 10
  },
  main: {
    position: 'relative',
  },
  border: {
    border: 1,
    paddingVertical: 100,
    paddingHorizontal: 100,
    marginBottom: 10,
  },
});

interface ReportTemplateProps {
  report: {
    patientDetails: {
      name: string,
      birthYear: string,
      phoneNumber: string,
    },
    hospitalDetails: {
      name: string,
      department: string,
      address: string,
      phone: string,
    },
    imageUrls: string[],
    conclusionText: string,
    radiologistName: string,
    headDoctorName: string,
    createdAt: Timestamp,
  };
}

function formatTimestampToDate(timestamp: Timestamp): string {
  const date = timestamp.toDate();
  return date.toLocaleDateString('en-US');
}

const ReportTemplate = ({ report } : ReportTemplateProps) => {
  return (
    <Document>
      <Page style={styles.body}>
        <View style={styles.main}>
          <View style={styles.header}>
            <Text style={styles.headerTitleWithBorder}>{report.hospitalDetails.name.toUpperCase()}</Text>
            <Text style={styles.headerTitle}>{report.hospitalDetails.department.toUpperCase()}</Text>
            <Text style={styles.headerText}>{report.hospitalDetails.address}</Text>
          </View>
          <View style={styles.makeRow}>
            <View style={styles.section}>
              <Text style={styles.infoHeader}>{'Patient Infos'.toUpperCase()}</Text>
              <Text style={styles.text}>Name: {report.patientDetails.name}</Text>
              <Text style={styles.text}>Birth Year: {report.patientDetails.birthYear}</Text>
              <Text style={styles.text}>Phone Number: {report.patientDetails.phoneNumber}</Text>
            </View>
            <View style={styles.section}>
              <Text style={styles.infoHeader}>{'Medicals Infos'.toUpperCase()}</Text>
              <Text style={styles.text}>Radiologist Name: {report.radiologistName}</Text>
              <Text style={styles.text}>Doctor Name: {report.headDoctorName}</Text>
              <Text style={styles.text}>Date: {formatTimestampToDate(report.createdAt)}</Text>
            </View>
          </View>
          <View style={styles.section}>
            <View style={styles.imageCenter}>
              <Text style={styles.headerTitleCentered}>{studyType}</Text>
              {report.imageUrls.map((url, index) => (
                <Image key={index} src={url} style={styles.image} />
              ))}
            </View>
          </View>
          <View style={styles.section}>
            <Text style={styles.headerTitleCentered}>{'Medical Conclusion'.toUpperCase()}</Text>
            <Text style={styles.text}>{report.conclusionText}</Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.headerTitleCentered}>{'Additional Notes'.toUpperCase()}</Text>
            <Text style={styles.notes}>(use the given blank space to add any additional notes, comments, and sketches)</Text>
            <Text style={styles.border}></Text>
          </View>
        </View>
        <View style={styles.footer}>
          <Text style={styles.footerText}>{disclaimerA}</Text>
          <Text style={styles.footerText}>{disclaimerB + ' ' + report.hospitalDetails.phone}</Text>
        </View>
      </Page>
    </Document>
  )
}

export async function GET(request: Request, { params } : { params: any }) {
  const report = {
    patientDetails: {
      name: "Ibrohim Abdivokhidov",
      birthYear: "2003",
      phoneNumber: "+998938966698"
    },
    hospitalDetails: {
      name: 'SI "REPUBLICAN SPECIALIZED CENTER FOR SURGERY NAMED AFTER ACADEMICIAN V. VAKHIDOV"',
      department: "DEPARTMENT OF MAGNETIC RESONANCE AND COMPUTED TOMOGRAPHY",
      address: `Uzbekistan, Tashkent, ul. Farkhadskaya 10.`,
      phone: "+998903102024"
    },
    imageUrls: [
      "https://firebasestorage.googleapis.com/v0/b/comed-27032024.appspot.com/o/images%2FY12.jpg?alt=media&token=5e53394c-f012-4aee-901c-c028f1c2e570",
    ],
    conclusionText: "MRI signs of vascular encephalopathy with the presence of multiple ischemic foci and atrophy of the frontotemporal areas on both sides. Left maxillary sinus cyst. Consultation with a neurologist is recommended. Consultation with an otolaryngologist is recommended.",
    radiologistName: "Dr. Aziza",
    headDoctorName: "Dr. Nigora",
    createdAt: Timestamp.fromDate(new Date()),
  };

  const stream = await renderToStream(<ReportTemplate report={report} />);
  return new NextResponse(stream as unknown as ReadableStream)
}