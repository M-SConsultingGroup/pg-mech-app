import { NextRequest, NextResponse } from 'next/server';
import moment from 'moment-timezone';
import Sequence from '@/models/sequence';
import Ticket from '@/models/ticket';
import { getLogger } from '@/lib/logger';
import { getCorrelationId } from '@/utils/helpers';


export class TicketController {

  static async createTicket(req: NextRequest) {
    const correlationId = getCorrelationId(req);
    const logger = getLogger().child({ correlationId });

    try {
      const body = await req.json();
      const ticketNumber = await generateTicketNumber();
      const ticket = new Ticket({ ...body, ticketNumber });
      await ticket.save();
      return NextResponse.json(ticket, { status: 201 });
    } catch (error) {
      logger.error('Error creating ticket:', error);
      return NextResponse.json({ error: (error as Error).message }, { status: 400 });
    }
  };

  static async updateTicket(req: NextRequest) {
    const correlationId = getCorrelationId(req);
    const logger = getLogger().child({ correlationId });

    try {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get('id');
      const body = await req.json();
      body.updatedAt = new Date();

      // Logic to handle priority and status changes
      if (body.assignedTo === 'Unassigned') {
        body.status = 'New';
        body.priority = '';
      }

      if (body.status !== 'Open') {
        body.priority = '';
      }

      const ticket = await Ticket.findByIdAndUpdate(id, body, { new: true, runValidators: true });
      if (!ticket) {
        return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
      }
      return NextResponse.json(ticket);
    } catch (error) {
      logger.error('Error updating ticket:', error);
      return NextResponse.json({ error: (error as Error).message }, { status: 400 });
    }
  };

  static async getTickets(req: NextRequest) {
    const correlationId = getCorrelationId(req);
    const logger = getLogger().child({ correlationId });

    try {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get('id');
      let tickets;

      if (id) {
        tickets = await Ticket.findById(id);
        if (!tickets) {
          return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }
      } else {
        tickets = await Ticket.find();
      }

      return NextResponse.json(tickets, { status: 200 });
    } catch (err) {
      logger.error('Error fetching tickets:', err);
      const error = err as Error;
      return NextResponse.json({ name: error.name, error: 'Error fetching tickets' }, { status: 500 });
    }
  };

  static async deleteTicket(req: NextRequest) {
    const correlationId = getCorrelationId(req);
    const logger = getLogger().child({ correlationId });

    try {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get('id');
      const ticket = await Ticket.findByIdAndDelete(id);
      if (!ticket) {
        return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
      }
      return NextResponse.json(ticket);
    } catch (error) {
      logger.error('Error deleting ticket:', error);
      return NextResponse.json({ error: (error as Error).message }, { status: 400 });
    }
  };

  static async rescheduleTicket(req: NextRequest) {
    const correlationId = getCorrelationId(req);
    const logger = getLogger().child({ correlationId });

    try {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get('id');
      const body = await req.json();

      const ticket = await Ticket.findById(id);
      if (!ticket) {
        return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
      }

      ticket.timeAvailability = body.timeAvailability;
      await ticket.save();

      return NextResponse.json(ticket, { status: 200 });
    } catch (error) {
      logger.error('Error rescheduling ticket:', error);
      return NextResponse.json({ error: (error as Error).message }, { status: 400 });
    }
  };

  static async conditionalDeleteTicket(req: NextRequest) {
    const correlationId = getCorrelationId(req);
    const logger = getLogger().child({ correlationId });

    try {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get('id');

      const ticket = await Ticket.findById(id);
      if (!ticket) {
        return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
      }

      if (ticket.assignedTo && ticket.assignedTo !== 'Unassigned') {
        return NextResponse.json({ error: 'Cannot delete assigned ticket' }, { status: 400 });
      }

      await ticket.deleteOne();
      return NextResponse.json({ message: 'Ticket deleted successfully' }, { status: 200 });
    } catch (error) {
      logger.error('Error deleting ticket:', error);
      return NextResponse.json({ error: (error as Error).message }, { status: 400 });
    }
  }

}

const generateTicketNumber = async () => {
  const date = moment().tz('America/Chicago'); // Central Time
  const currentDate = date.format('YYYY-MM-DD');

  let sequenceDoc = await Sequence.findOne({ date: currentDate });

  if (!sequenceDoc) {
    sequenceDoc = new Sequence({ date: currentDate, sequence: 0 });
  }

  sequenceDoc.sequence += 1;
  await sequenceDoc.save();

  const year = date.year();
  const month = date.format('MM');
  const day = date.format('DD');

  return `${year}${month}${day}-${sequenceDoc.sequence.toString().padStart(4, '0')}`;
};
